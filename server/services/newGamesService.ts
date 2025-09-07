import { db } from "../db";
import { eq, and, lt, gt, desc, asc } from "drizzle-orm";
import crypto from "crypto";
import { 
  surpriseDraws, 
  surpriseDrawTickets,
  mysterySearchRounds,
  mysterySearchRegistrations,
  mysterySearchSubmissions,
  tryYourLuckRounds,
  tryYourLuckParticipants,
  wallets,
  transactions,
  type InsertSurpriseDraw,
  type InsertSurpriseDrawTicket,
  type InsertMysterySearchRound,
  type InsertMysterySearchRegistration,
  type InsertMysterySearchSubmission,
  type InsertTryYourLuckRound,
  type InsertTryYourLuckParticipant,
  type SurpriseDraw,
  type MysterySearchRound,
  type TryYourLuckRound
} from "@shared/schema";

export class NewGamesService {
  // === SURPRISE DRAWS ===
  
  async createSurpriseDraw(draw: InsertSurpriseDraw): Promise<SurpriseDraw> {
    const [newDraw] = await db.insert(surpriseDraws).values(draw).returning();
    return newDraw;
  }

  async getActiveSurpriseDraw(): Promise<SurpriseDraw | null> {
    const [activeDraw] = await db
      .select()
      .from(surpriseDraws)
      .where(eq(surpriseDraws.status, 'active'))
      .limit(1);
    
    return activeDraw || null;
  }

  async purchaseSurpriseDrawTicket(drawId: string, userId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get draw details
      const [draw] = await tx.select().from(surpriseDraws).where(eq(surpriseDraws.id, drawId));
      if (!draw || draw.status !== 'active') {
        throw new Error('Draw not available');
      }

      // Check user wallet
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      if (!wallet || parseFloat(wallet.balance) < parseFloat(draw.ticketPrice)) {
        throw new Error('Insufficient balance');
      }

      // Generate unique ticket number
      const ticketNumber = await this.generateUniqueTicketNumber(drawId, tx);

      // Deduct from wallet
      const newBalance = parseFloat(wallet.balance) - parseFloat(draw.ticketPrice);
      await tx.update(wallets)
        .set({ balance: newBalance.toString() })
        .where(eq(wallets.userId, userId));

      // Create ticket
      await tx.insert(surpriseDrawTickets).values({
        surpriseDrawId: drawId,
        userId: userId,
        ticketNumber: ticketNumber
      });

      // Record transaction
      await tx.insert(transactions).values({
        type: 'surprise_ticket_purchase',
        amount: `-${draw.ticketPrice}`,
        description: `Surprise Draw Ticket #${ticketNumber}`,
        walletId: wallet.id
      });
    });
  }

  async executeSurpriseDraw(drawId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      const [draw] = await tx.select().from(surpriseDraws).where(eq(surpriseDraws.id, drawId));
      if (!draw || draw.status !== 'active') {
        throw new Error('Draw not available for execution');
      }

      // Get all tickets
      const tickets = await tx.select().from(surpriseDrawTickets)
        .where(eq(surpriseDrawTickets.surpriseDrawId, drawId));

      if (tickets.length === 0) {
        // No tickets sold, mark as completed
        await tx.update(surpriseDraws)
          .set({ status: 'completed', executedAt: new Date() })
          .where(eq(surpriseDraws.id, drawId));
        return;
      }

      // Select winners using cryptographically secure random selection
      const winners = this.selectRandomWinners(tickets, draw.numberOfWinners);
      const prizePerWinner = parseFloat(draw.prizePool) / winners.length;

      // Update winner tickets and distribute prizes
      for (const winner of winners) {
        await tx.update(surpriseDrawTickets)
          .set({ isWinner: true, prizeAmount: prizePerWinner.toString() })
          .where(eq(surpriseDrawTickets.id, winner.id));

        // Add winnings to wallet
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, winner.userId));
        if (wallet) {
          const newBalance = parseFloat(wallet.balance) + prizePerWinner;
          await tx.update(wallets)
            .set({ balance: newBalance.toString() })
            .where(eq(wallets.userId, winner.userId));

          // Record transaction
          await tx.insert(transactions).values({
            type: 'surprise_draw_win',
            amount: prizePerWinner.toString(),
            description: `Surprise Draw Winner - ${draw.title}`,
            walletId: wallet.id
          });
        }
      }

      // Mark draw as completed
      await tx.update(surpriseDraws)
        .set({ status: 'completed', executedAt: new Date() })
        .where(eq(surpriseDraws.id, drawId));
    });
  }

  // === MYSTERY SEARCH GAME ===

  async createMysterySearchRound(): Promise<MysterySearchRound> {
    const seedPhrase = this.generateRandomSeedPhrase();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    const firstClueReveal = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Initial revealed words: 1st and 10th
    const initialRevealed = {
      1: seedPhrase.split(' ')[0],
      10: seedPhrase.split(' ')[9]
    };

    const roundData: InsertMysterySearchRound = {
      seedPhrase: this.encryptSeedPhrase(seedPhrase),
      revealedWords: initialRevealed,
      status: 'registration',
      startTime: startTime,
      endTime: endTime,
      nextClueRevealAt: firstClueReveal
    };

    const [newRound] = await db.insert(mysterySearchRounds).values(roundData).returning();
    return newRound;
  }

  async getCurrentMysterySearchRound(): Promise<MysterySearchRound | null> {
    const [currentRound] = await db
      .select()
      .from(mysterySearchRounds)
      .where(and(
        eq(mysterySearchRounds.status, 'active'),
        gt(mysterySearchRounds.endTime, new Date())
      ))
      .limit(1);
    
    return currentRound || null;
  }

  async registerForMysterySearch(userId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get current round
      const [round] = await tx.select().from(mysterySearchRounds)
        .where(eq(mysterySearchRounds.status, 'registration'))
        .limit(1);
      
      if (!round) {
        throw new Error('No active registration period');
      }

      // Check if already registered
      const [existing] = await tx.select().from(mysterySearchRegistrations)
        .where(and(
          eq(mysterySearchRegistrations.roundId, round.id),
          eq(mysterySearchRegistrations.userId, userId)
        ));
      
      if (existing) {
        throw new Error('Already registered for this round');
      }

      // Check user wallet
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      const registrationFee = parseFloat(round.registrationFee);
      
      if (!wallet || parseFloat(wallet.balance) < registrationFee) {
        throw new Error('Insufficient balance');
      }

      // Deduct registration fee
      const newBalance = parseFloat(wallet.balance) - registrationFee;
      await tx.update(wallets)
        .set({ balance: newBalance.toString() })
        .where(eq(wallets.userId, userId));

      // Add to prize pool
      const newPrizePool = parseFloat(round.prizePool) + registrationFee;
      await tx.update(mysterySearchRounds)
        .set({ prizePool: newPrizePool.toString() })
        .where(eq(mysterySearchRounds.id, round.id));

      // Register user
      await tx.insert(mysterySearchRegistrations).values({
        roundId: round.id,
        userId: userId
      });

      // Record transaction
      await tx.insert(transactions).values({
        type: 'mystery_search_registration',
        amount: `-${registrationFee}`,
        description: 'Mystery Search Game Registration',
        walletId: wallet.id
      });
    });
  }

  async submitMysterySearchGuess(roundId: string, userId: string, submission: string): Promise<{ correct: boolean; cooldownUntil?: Date }> {
    return await db.transaction(async (tx) => {
      // Check if user is registered
      const [registration] = await tx.select().from(mysterySearchRegistrations)
        .where(and(
          eq(mysterySearchRegistrations.roundId, roundId),
          eq(mysterySearchRegistrations.userId, userId)
        ));
      
      if (!registration) {
        throw new Error('Not registered for this round');
      }

      // Check cooldown
      const [lastSubmission] = await tx.select().from(mysterySearchSubmissions)
        .where(and(
          eq(mysterySearchSubmissions.roundId, roundId),
          eq(mysterySearchSubmissions.userId, userId)
        ))
        .orderBy(desc(mysterySearchSubmissions.submittedAt))
        .limit(1);

      if (lastSubmission?.cooldownUntil && lastSubmission.cooldownUntil > new Date()) {
        throw new Error('Still in cooldown period');
      }

      // Get round details
      const [round] = await tx.select().from(mysterySearchRounds).where(eq(mysterySearchRounds.id, roundId));
      if (!round || round.status !== 'active') {
        throw new Error('Round not active');
      }

      // Check if submission is correct
      const decryptedSeedPhrase = this.decryptSeedPhrase(round.seedPhrase);
      const isCorrect = submission.toLowerCase().trim() === decryptedSeedPhrase.toLowerCase().trim();

      let cooldownUntil = undefined;
      if (!isCorrect) {
        cooldownUntil = new Date(Date.now() + 60 * 1000); // 1 minute cooldown
      }

      // Record submission
      await tx.insert(mysterySearchSubmissions).values({
        roundId: roundId,
        userId: userId,
        submission: submission,
        isCorrect: isCorrect,
        cooldownUntil: cooldownUntil
      });

      if (isCorrect) {
        // Update round with winner
        await tx.update(mysterySearchRounds).set({
          winnerId: userId,
          winnerSubmission: submission,
          wonAt: new Date(),
          status: 'completed'
        }).where(eq(mysterySearchRounds.id, roundId));

        // Award prize
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
        if (wallet) {
          const prizeAmount = parseFloat(round.prizePool);
          const newBalance = parseFloat(wallet.balance) + prizeAmount;
          
          await tx.update(wallets)
            .set({ balance: newBalance.toString() })
            .where(eq(wallets.userId, userId));

          await tx.insert(transactions).values({
            type: 'mystery_search_win',
            amount: prizeAmount.toString(),
            description: 'Mystery Search Game Winner',
            walletId: wallet.id
          });
        }
      }

      return { correct: isCorrect, cooldownUntil };
    });
  }

  async revealNextClue(roundId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      const [round] = await tx.select().from(mysterySearchRounds).where(eq(mysterySearchRounds.id, roundId));
      if (!round || round.status !== 'active') return;

      const seedWords = this.decryptSeedPhrase(round.seedPhrase).split(' ');
      const revealedWords = round.revealedWords as Record<string, string>;
      
      // Clue reveal order: 4th → 12th → 7th → 3rd → 9th → 11th → 2nd → 8th → 5th → 6th
      const revealOrder = [4, 12, 7, 3, 9, 11, 2, 8, 5, 6];
      
      for (const position of revealOrder) {
        if (!revealedWords[position.toString()]) {
          revealedWords[position.toString()] = seedWords[position - 1];
          
          // Calculate next reveal time (4 hours later)
          const nextReveal = new Date(Date.now() + 4 * 60 * 60 * 1000);
          
          await tx.update(mysterySearchRounds).set({
            revealedWords: revealedWords,
            nextClueRevealAt: nextReveal
          }).where(eq(mysterySearchRounds.id, roundId));
          
          break;
        }
      }
    });
  }

  // === TRY YOUR LUCK GAME ===

  async getCurrentTryYourLuckRound(): Promise<TryYourLuckRound | null> {
    const [currentRound] = await db
      .select()
      .from(tryYourLuckRounds)
      .where(eq(tryYourLuckRounds.status, 'active'))
      .orderBy(desc(tryYourLuckRounds.createdAt))
      .limit(1);
    
    return currentRound || null;
  }

  async createTryYourLuckRound(): Promise<TryYourLuckRound> {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const roundData: InsertTryYourLuckRound = {
      status: 'active',
      startTime: startTime,
      endTime: endTime
    };

    const [newRound] = await db.insert(tryYourLuckRounds).values(roundData).returning();
    return newRound;
  }

  async joinTryYourLuck(userId: string, lockType: 'standard' | 'until_win'): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get current round
      const [round] = await tx.select().from(tryYourLuckRounds)
        .where(eq(tryYourLuckRounds.status, 'active'))
        .limit(1);
      
      if (!round) {
        throw new Error('No active round');
      }

      // Check if already participating
      const [existing] = await tx.select().from(tryYourLuckParticipants)
        .where(and(
          eq(tryYourLuckParticipants.roundId, round.id),
          eq(tryYourLuckParticipants.userId, userId)
        ));
      
      if (existing) {
        throw new Error('Already participating in this round');
      }

      // Check user wallet
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      const lockAmount = parseFloat(round.lockAmount);
      
      if (!wallet || parseFloat(wallet.balance) < lockAmount) {
        throw new Error('Insufficient balance');
      }

      // Lock money
      const newBalance = parseFloat(wallet.balance) - lockAmount;
      await tx.update(wallets)
        .set({ balance: newBalance.toString() })
        .where(eq(wallets.userId, userId));

      // Add to prize pool (only for standard locks)
      if (lockType === 'standard') {
        const newPrizePool = parseFloat(round.prizePool) + lockAmount;
        await tx.update(tryYourLuckRounds)
          .set({ prizePool: newPrizePool.toString() })
          .where(eq(tryYourLuckRounds.id, round.id));
      }

      // Register participant
      await tx.insert(tryYourLuckParticipants).values({
        roundId: round.id,
        userId: userId,
        lockType: lockType,
        lockedAmount: lockAmount.toString()
      });

      // Record transaction
      await tx.insert(transactions).values({
        type: 'try_your_luck_lock',
        amount: `-${lockAmount}`,
        description: `Try Your Luck - ${lockType} lock`,
        walletId: wallet.id
      });
    });
  }

  async executeTryYourLuckRound(roundId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      const [round] = await tx.select().from(tryYourLuckRounds).where(eq(tryYourLuckRounds.id, roundId));
      if (!round || round.status !== 'active') {
        throw new Error('Round not available for execution');
      }

      // Get all participants
      const participants = await tx.select().from(tryYourLuckParticipants)
        .where(eq(tryYourLuckParticipants.roundId, roundId));

      if (participants.length === 0) {
        // No participants, mark as completed
        await tx.update(tryYourLuckRounds)
          .set({ status: 'completed', executedAt: new Date() })
          .where(eq(tryYourLuckRounds.id, roundId));
        return;
      }

      // Select winner using cryptographically secure random selection
      const winnerIndex = crypto.randomInt(0, participants.length);
      const winner = participants[winnerIndex];

      // Award prize to winner
      const prizeAmount = parseFloat(round.prizePool);
      
      await tx.update(tryYourLuckParticipants)
        .set({ isWinner: true, prizeAmount: prizeAmount.toString() })
        .where(eq(tryYourLuckParticipants.id, winner.id));

      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, winner.userId));
      if (wallet) {
        const newBalance = parseFloat(wallet.balance) + prizeAmount;
        await tx.update(wallets)
          .set({ balance: newBalance.toString() })
          .where(eq(wallets.userId, winner.userId));

        await tx.insert(transactions).values({
          type: 'try_your_luck_win',
          amount: prizeAmount.toString(),
          description: 'Try Your Luck Winner',
          walletId: wallet.id
        });
      }

      // Handle non-winners
      for (const participant of participants) {
        if (participant.id !== winner.id) {
          if (participant.lockType === 'standard') {
            // Unlock money for standard participants
            const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, participant.userId));
            if (wallet) {
              const refundAmount = parseFloat(participant.lockedAmount);
              const newBalance = parseFloat(wallet.balance) + refundAmount;
              
              await tx.update(wallets)
                .set({ balance: newBalance.toString() })
                .where(eq(wallets.userId, participant.userId));

              await tx.insert(transactions).values({
                type: 'try_your_luck_refund',
                amount: refundAmount.toString(),
                description: 'Try Your Luck - Standard unlock',
                walletId: wallet.id
              });

              await tx.update(tryYourLuckParticipants)
                .set({ unlockedAt: new Date() })
                .where(eq(tryYourLuckParticipants.id, participant.id));
            }
          }
          // "until_win" participants keep their money locked for next rounds
        }
      }

      // Update round
      await tx.update(tryYourLuckRounds)
        .set({ 
          status: 'completed', 
          winnerId: winner.userId,
          executedAt: new Date() 
        })
        .where(eq(tryYourLuckRounds.id, roundId));
    });
  }

  async requestUnlock(userId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Find active "until_win" participant
      const [participant] = await tx.select({
        participant: tryYourLuckParticipants,
        round: tryYourLuckRounds
      })
      .from(tryYourLuckParticipants)
      .innerJoin(tryYourLuckRounds, eq(tryYourLuckParticipants.roundId, tryYourLuckRounds.id))
      .where(and(
        eq(tryYourLuckParticipants.userId, userId),
        eq(tryYourLuckParticipants.lockType, 'until_win'),
        eq(tryYourLuckParticipants.unlockRequested, false),
        eq(tryYourLuckRounds.status, 'active')
      ))
      .limit(1);

      if (!participant) {
        throw new Error('No eligible locked funds found');
      }

      // Mark unlock requested
      await tx.update(tryYourLuckParticipants)
        .set({ unlockRequested: true })
        .where(eq(tryYourLuckParticipants.id, participant.participant.id));
    });
  }

  // === UTILITY METHODS ===

  private async generateUniqueTicketNumber(drawId: string, tx: any): Promise<number> {
    for (let attempt = 0; attempt < 100; attempt++) {
      const ticketNumber = crypto.randomInt(100000, 999999);
      
      const [existing] = await tx.select().from(surpriseDrawTickets)
        .where(and(
          eq(surpriseDrawTickets.surpriseDrawId, drawId),
          eq(surpriseDrawTickets.ticketNumber, ticketNumber)
        ));
      
      if (!existing) return ticketNumber;
    }
    throw new Error('Unable to generate unique ticket number');
  }

  private selectRandomWinners<T extends { id: string }>(tickets: T[], numberOfWinners: number): T[] {
    const shuffled = [...tickets];
    // Fisher-Yates shuffle with crypto.randomInt for fairness
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(numberOfWinners, shuffled.length));
  }

  private generateRandomSeedPhrase(): string {
    // BIP39 word list (simplified - first 100 words)
    const wordList = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
      'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
      'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
      'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'agent', 'agree',
      'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien',
      'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always',
      'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
      'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
      'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arcade', 'arch', 'arctic',
      'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest'
    ];

    const words: string[] = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = crypto.randomInt(0, wordList.length);
      words.push(wordList[randomIndex]);
    }
    return words.join(' ');
  }

  private encryptSeedPhrase(seedPhrase: string): string {
    // Simple encryption for demo - in production use proper encryption
    return Buffer.from(seedPhrase).toString('base64');
  }

  private decryptSeedPhrase(encryptedSeedPhrase: string): string {
    // Simple decryption for demo - in production use proper decryption
    return Buffer.from(encryptedSeedPhrase, 'base64').toString('utf-8');
  }
}

// Export singleton instance
export const newGamesService = new NewGamesService();