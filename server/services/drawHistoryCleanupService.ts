import { db } from "../db";
import { draws, drawWinners, lotteries } from "@shared/schema";
import { eq, and, desc, not, inArray } from "drizzle-orm";

export class DrawHistoryCleanupService {
  private readonly historyLimits = {
    daily: 15,
    weekly: 5,
    monthly: 3
  };

  /**
   * Clean up old completed draws beyond history limits
   */
  async cleanupOldDraws(): Promise<void> {
    console.log('🧹 Starting draw history cleanup...');
    
    try {
      for (const [lotteryType, limit] of Object.entries(this.historyLimits)) {
        await this.cleanupDrawsForType(lotteryType, limit);
      }
      
      console.log('✅ Draw history cleanup completed successfully');
    } catch (error) {
      console.error('❌ Error during draw history cleanup:', error);
    }
  }

  /**
   * Clean up old draws for a specific lottery type
   */
  private async cleanupDrawsForType(lotteryType: string, limit: number): Promise<void> {
    // Get the lottery ID for this type
    const lottery = await db.query.lotteries.findFirst({
      where: (lotteries, { eq }) => eq(lotteries.type, lotteryType)
    });

    if (!lottery) {
      console.log(`⚠️ No lottery found for type: ${lotteryType}`);
      return;
    }

    // Get all completed draws for this lottery type, ordered by date (newest first)
    const allDraws = await db
      .select({ id: draws.id })
      .from(draws)
      .where(and(
        eq(draws.lotteryId, lottery.id),
        eq(draws.status, "completed")
      ))
      .orderBy(desc(draws.drawDate));

    // If we have more draws than the limit, delete the excess
    if (allDraws.length > limit) {
      const drawsToKeep = allDraws.slice(0, limit);
      const drawsToDelete = allDraws.slice(limit);

      if (drawsToDelete.length > 0) {
        const drawIdsToDelete = drawsToDelete.map(draw => draw.id);

        // First, delete all draw_winners records for these draws
        await db
          .delete(drawWinners)
          .where(inArray(drawWinners.drawId, drawIdsToDelete));

        // Then delete the draws themselves
        await db
          .delete(draws)
          .where(inArray(draws.id, drawIdsToDelete));

        console.log(`🗑️ Cleaned up ${drawsToDelete.length} old ${lotteryType} draws (keeping last ${limit})`);
      }
    } else {
      console.log(`✅ ${lotteryType.charAt(0).toUpperCase() + lotteryType.slice(1)} draws within limit (${allDraws.length}/${limit})`);
    }
  }

  /**
   * Schedule automatic cleanup to run weekly
   */
  startScheduledCleanup(): void {
    // Run cleanup every Sunday at 2 AM
    const cleanupInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    // Run initial cleanup after 1 minute
    setTimeout(() => {
      this.cleanupOldDraws();
      
      // Then run weekly
      setInterval(() => {
        this.cleanupOldDraws();
      }, cleanupInterval);
    }, 60000); // 1 minute delay

    console.log('📅 Draw history cleanup scheduled to run weekly');
  }
}

export const drawHistoryCleanupService = new DrawHistoryCleanupService();