import { db } from "../db";
import { draws, drawWinners, users, lotteries } from "@shared/schema";
import { eq, and, desc, lt } from "drizzle-orm";

interface FakeWinner {
  firstName: string;
  lastName: string;
  prizeAmount: number;
  prizeDescription: string;
  winnerType: string;
}

// No longer using fake names - now using ticket hashes for better authenticity

export class FakeWinnerService {
  private generateFakeTicketHash(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hash = '';
    for (let i = 0; i < 8; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateFakeWinners(lotteryType: string, drawId: string): FakeWinner[] {
    const winners: FakeWinner[] = [];
    
    if (lotteryType === 'daily') {
      // Generate 2-5 daily winners
      const winnerCount = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < winnerCount; i++) {
        const ticketHash = this.generateFakeTicketHash();
        const prizeAmount = Math.floor(Math.random() * 50) + 10; // $10-60
        winners.push({
          firstName: 'Ticket',
          lastName: `#${ticketHash}`,
          prizeAmount,
          prizeDescription: `Daily Draw Winner - Tier ${i + 1}`,
          winnerType: 'regular'
        });
      }
    } else if (lotteryType === 'weekly') {
      // Generate 1-3 weekly winners with higher prizes
      const winnerCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < winnerCount; i++) {
        const ticketHash = this.generateFakeTicketHash();
        const prizeAmount = Math.floor(Math.random() * 500) + 100; // $100-600
        winners.push({
          firstName: 'Ticket',
          lastName: `#${ticketHash}`,
          prizeAmount,
          prizeDescription: `Weekly Mega Winner - Prize ${i + 1}`,
          winnerType: 'regular'
        });
      }
    } else if (lotteryType === 'monthly') {
      // Generate 1-2 monthly winners with highest prizes
      const winnerCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < winnerCount; i++) {
        const ticketHash = this.generateFakeTicketHash();
        const prizeAmount = Math.floor(Math.random() * 2000) + 500; // $500-2500
        winners.push({
          firstName: 'Ticket',
          lastName: `#${ticketHash}`,
          prizeAmount,
          prizeDescription: `Monthly Grand Prize Winner`,
          winnerType: 'jackpot'
        });
      }
    }

    return winners;
  }

  async createFakeUser(firstName: string, lastName: string): Promise<string> {
    // Create a fake user ID that doesn't conflict with real users
    const fakeUserId = `fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await db.insert(users).values({
        id: fakeUserId,
        email: `ticket_${lastName.replace('#', '').toLowerCase()}@system.lottery`,
        firstName,
        lastName,
        profileImageUrl: null,
        isAdmin: false
      });
    } catch (error) {
      // User might already exist, that's OK
      console.log('Fake user creation skipped (may already exist)');
    }
    
    return fakeUserId;
  }

  async addFakeWinnersToRecentDraws(): Promise<void> {
    console.log('🎭 Adding fake winners to recent draws...');
    
    // Get the 3 most recent completed draws that don't have real winners
    const recentDraws = await db
      .select()
      .from(draws)
      .where(eq(draws.status, 'completed'))
      .orderBy(desc(draws.executedAt))
      .limit(3);

    for (const draw of recentDraws) {
      // Check if this draw already has real winners (ticketsSold > 0)
      if (draw.ticketsSold && draw.ticketsSold > 0) {
        console.log(`Skipping draw ${draw.id} - has real tickets/winners`);
        continue;
      }

      // Check if fake winners already exist
      const existingWinners = await db
        .select()
        .from(drawWinners)
        .where(eq(drawWinners.drawId, draw.id));

      if (existingWinners.length > 0) {
        console.log(`Draw ${draw.id} already has winners, skipping`);
        continue;
      }

      // Get lottery info to determine type
      const lottery = await db.query.lotteries.findFirst({
        where: (lotteries, { eq }) => eq(lotteries.id, draw.lotteryId)
      });

      if (!lottery) continue;

      // Generate fake winners
      const fakeWinners = this.generateFakeWinners(lottery.type, draw.id);
      
      for (const winner of fakeWinners) {
        // Create fake user
        const userId = await this.createFakeUser(winner.firstName, winner.lastName);
        
        // Create fake winner entry
        await db.insert(drawWinners).values({
          drawId: draw.id,
          ticketId: null, // No real ticket for fake winners
          userId,
          winnerType: winner.winnerType,
          prizeAmount: winner.prizeAmount.toString(),
          prizeDescription: winner.prizeDescription,
          isDistributed: true,
          distributedAt: new Date()
        });
      }

      console.log(`✅ Added ${fakeWinners.length} fake winners to ${lottery.type} draw ${draw.id}`);
    }
  }

  /**
   * Populate ALL completed draws with fake winners for marketing purposes
   */
  async populateAllDrawsWithFakeWinners(): Promise<void> {
    console.log('🎯 MARKETING BOOST: Populating ALL draws with fake winners...');
    
    // Get ALL completed draws
    const allCompletedDraws = await db
      .select()
      .from(draws)
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(eq(draws.status, 'completed'))
      .orderBy(desc(draws.drawDate));

    let processedCount = 0;
    let addedCount = 0;

    for (const result of allCompletedDraws) {
      const draw = result.draws;
      const lottery = result.lotteries;
      
      processedCount++;

      // Check if winners already exist
      const existingWinners = await db
        .select()
        .from(drawWinners)
        .where(eq(drawWinners.drawId, draw.id));

      if (existingWinners.length > 0) {
        console.log(`📊 Draw ${draw.id} (${lottery.type}) already has ${existingWinners.length} winners`);
        continue;
      }

      // Generate fake winners for this draw
      const fakeWinners = this.generateFakeWinners(lottery.type, draw.id);
      
      for (const winner of fakeWinners) {
        // Create fake user with ticket hash
        const userId = await this.createFakeUser(winner.firstName, winner.lastName);
        
        // Create fake winner entry
        await db.insert(drawWinners).values({
          drawId: draw.id,
          ticketId: null, // No real ticket for fake winners
          userId,
          winnerType: winner.winnerType,
          prizeAmount: winner.prizeAmount.toString(),
          prizeDescription: winner.prizeDescription,
          isDistributed: true,
          distributedAt: new Date(draw.drawDate)
        });
      }

      addedCount++;
      console.log(`✅ Added ${fakeWinners.length} fake winners to ${lottery.type} draw ${draw.id} (${new Date(draw.drawDate).toLocaleDateString()})`);
    }

    console.log(`🎉 MARKETING COMPLETE! Processed ${processedCount} draws, added winners to ${addedCount} draws`);
    console.log(`🚀 Your lottery platform now has active winners in ALL draw history!`);
  }

  async generateWeeklyFakeWinners(): Promise<void> {
    console.log('🔄 Weekly fake winner generation started...');
    
    // Remove old fake winners (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      // Find fake users (users with fake_ prefix IDs)
      const fakeUsers = await db
        .select()
        .from(users)
        .where(lt(users.createdAt, thirtyDaysAgo));
      
      for (const user of fakeUsers) {
        if (user.id.startsWith('fake_')) {
          // Remove their winner entries first
          await db.delete(drawWinners).where(eq(drawWinners.userId, user.id));
          // Remove the fake user
          await db.delete(users).where(eq(users.id, user.id));
        }
      }
      
      console.log('🗑️ Cleaned up old fake winners');
    } catch (error) {
      console.log('Cleanup completed with minor issues (expected)');
    }

    // Add new fake winners to recent draws
    await this.addFakeWinnersToRecentDraws();
    
    console.log('✅ Weekly fake winner generation completed');
  }
}

export const fakeWinnerService = new FakeWinnerService();