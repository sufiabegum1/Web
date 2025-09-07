import * as cron from 'node-cron';
import { db } from '../db';
import { eq, and, lt, lte } from 'drizzle-orm';
import { 
  mysterySearchRounds, 
  tryYourLuckRounds,
  surpriseDraws,
  type MysterySearchRound,
  type TryYourLuckRound 
} from '@shared/schema';
import { newGamesService } from './newGamesService';

export class GameScheduler {
  private clueRevealJob?: cron.ScheduledTask;
  private gameCleanupJob?: cron.ScheduledTask;
  private autoStartJob?: cron.ScheduledTask;

  start() {
    console.log('Starting game scheduler...');

    // Check for clue reveals every minute
    this.clueRevealJob = cron.schedule('* * * * *', async () => {
      await this.processClueReveals();
    });

    // Check for game completions and cleanup every 5 minutes
    this.gameCleanupJob = cron.schedule('*/5 * * * *', async () => {
      await this.processGameCompletions();
    });

    // Auto-start new rounds every hour
    this.autoStartJob = cron.schedule('0 * * * *', async () => {
      await this.autoStartNewRounds();
    });

    console.log('Game scheduler started successfully');
  }

  stop() {
    console.log('Stopping game scheduler...');
    
    this.clueRevealJob?.stop();
    this.gameCleanupJob?.stop();
    this.autoStartJob?.stop();
    
    console.log('Game scheduler stopped');
  }

  private async processClueReveals() {
    try {
      // Find rounds that need clue reveals
      const roundsNeedingReveals = await db
        .select()
        .from(mysterySearchRounds)
        .where(and(
          eq(mysterySearchRounds.status, 'active'),
          lte(mysterySearchRounds.nextClueRevealAt, new Date())
        ));

      for (const round of roundsNeedingReveals) {
        console.log(`Revealing next clue for mystery search round: ${round.id}`);
        await newGamesService.revealNextClue(round.id);
      }
    } catch (error) {
      console.error('Error processing clue reveals:', error);
    }
  }

  private async processGameCompletions() {
    try {
      await this.completeMysterySearchRounds();
      await this.completeTryYourLuckRounds();
      await this.completeSurpriseDraws();
    } catch (error) {
      console.error('Error processing game completions:', error);
    }
  }

  private async completeMysterySearchRounds() {
    // Find expired mystery search rounds
    const expiredRounds = await db
      .select()
      .from(mysterySearchRounds)
      .where(and(
        eq(mysterySearchRounds.status, 'active'),
        lte(mysterySearchRounds.endTime, new Date())
      ));

    for (const round of expiredRounds) {
      console.log(`Completing expired mystery search round: ${round.id}`);
      
      // Mark as completed and reveal full seed phrase
      await db.update(mysterySearchRounds)
        .set({ status: 'completed' })
        .where(eq(mysterySearchRounds.id, round.id));

      // Auto-start next round after 1 minute
      setTimeout(async () => {
        try {
          console.log('Auto-starting new mystery search round');
          await newGamesService.createMysterySearchRound();
        } catch (error) {
          console.error('Error auto-starting mystery search round:', error);
        }
      }, 60000);
    }
  }

  private async completeTryYourLuckRounds() {
    // Find expired try your luck rounds
    const expiredRounds = await db
      .select()
      .from(tryYourLuckRounds)
      .where(and(
        eq(tryYourLuckRounds.status, 'active'),
        lte(tryYourLuckRounds.endTime, new Date())
      ));

    for (const round of expiredRounds) {
      console.log(`Executing expired try your luck round: ${round.id}`);
      await newGamesService.executeTryYourLuckRound(round.id);

      // Auto-start next round after 1 minute
      setTimeout(async () => {
        try {
          console.log('Auto-starting new try your luck round');
          await newGamesService.createTryYourLuckRound();
        } catch (error) {
          console.error('Error auto-starting try your luck round:', error);
        }
      }, 60000);
    }
  }

  private async completeSurpriseDraws() {
    // Find expired surprise draws
    const expiredDraws = await db
      .select()
      .from(surpriseDraws)
      .where(and(
        eq(surpriseDraws.status, 'active'),
        lte(surpriseDraws.endTime, new Date())
      ));

    for (const draw of expiredDraws) {
      console.log(`Executing expired surprise draw: ${draw.id}`);
      await newGamesService.executeSurpriseDraw(draw.id);
    }
  }

  private async autoStartNewRounds() {
    try {
      // Check if mystery search round exists
      const [activeMysteryRound] = await db
        .select()
        .from(mysterySearchRounds)
        .where(eq(mysterySearchRounds.status, 'active'))
        .limit(1);

      if (!activeMysteryRound) {
        console.log('No active mystery search round found, creating new one');
        await newGamesService.createMysterySearchRound();
      }

      // Check if try your luck round exists
      const [activeTryYourLuckRound] = await db
        .select()
        .from(tryYourLuckRounds)
        .where(eq(tryYourLuckRounds.status, 'active'))
        .limit(1);

      if (!activeTryYourLuckRound) {
        console.log('No active try your luck round found, creating new one');
        await newGamesService.createTryYourLuckRound();
      }

      // Activate scheduled surprise draws
      const drawsToActivate = await db
        .select()
        .from(surpriseDraws)
        .where(and(
          eq(surpriseDraws.status, 'scheduled'),
          lte(surpriseDraws.startTime, new Date())
        ));

      for (const draw of drawsToActivate) {
        console.log(`Activating scheduled surprise draw: ${draw.id}`);
        await db.update(surpriseDraws)
          .set({ status: 'active' })
          .where(eq(surpriseDraws.id, draw.id));
      }

    } catch (error) {
      console.error('Error auto-starting rounds:', error);
    }
  }

  // Manual methods for testing/admin use
  async forceRevealClue(roundId: string) {
    console.log(`Force revealing clue for round: ${roundId}`);
    await newGamesService.revealNextClue(roundId);
  }

  async forceCompleteRound(roundId: string, gameType: 'mystery' | 'try_your_luck') {
    if (gameType === 'mystery') {
      await db.update(mysterySearchRounds)
        .set({ status: 'completed' })
        .where(eq(mysterySearchRounds.id, roundId));
    } else {
      await newGamesService.executeTryYourLuckRound(roundId);
    }
  }
}

// Export singleton instance
export const gameScheduler = new GameScheduler();