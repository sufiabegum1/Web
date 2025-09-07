import { randomInt } from 'crypto';
import { db } from '../db';
import { 
  draws, 
  tickets, 
  drawWinners, 
  monthlyTicketBonuses,
  transactions,
  wallets,
  lotteries,
  users,
  type Draw,
  type Ticket,
  type InsertDrawWinner,
  type InsertTransaction
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface LotteryRules {
  platformFeePercentage: number; // 30%
  distributionPercentage: number; // 70%
}

interface SpecialPrize {
  type: 'cash' | 'motorcycle' | 'iphone' | 'mystery_box';
  amount: number;
  description: string;
  count: number;
}

// No longer using fake names - now using ticket hashes for better authenticity

export class LotteryDrawingService {
  private readonly rules: LotteryRules = {
    platformFeePercentage: 0.30,
    distributionPercentage: 0.70,
  };

  /**
   * Execute a daily lottery draw with specific distribution rules
   */
  async executeDailyDraw(drawId: string): Promise<void> {
    const draw = await this.getDrawWithTickets(drawId);
    if (!draw || draw.status !== 'scheduled') {
      throw new Error('Invalid draw or draw already executed');
    }

    const totalPrizePool = parseFloat(draw.totalPrizePool || "0");
    const platformFees = totalPrizePool * this.rules.platformFeePercentage;
    const distributionPool = totalPrizePool * this.rules.distributionPercentage;

    // Update draw with calculated amounts
    await db.update(draws)
      .set({
        platformFees: platformFees.toFixed(2),
        distributionPool: distributionPool.toFixed(2),
        status: 'active',
        executedAt: new Date(),
      })
      .where(eq(draws.id, drawId));

    let remainingPool = distributionPool;
    const winners: InsertDrawWinner[] = [];

    // Marketing Strategy: Always show fake mega winner, give real prize if pool allows
    const fakeUserId = await this.createFakeDisplayUser();
    winners.push({
      drawId,
      ticketId: null,
      userId: fakeUserId,
      winnerType: 'special_cash_display',
      prizeAmount: '10000.00',
      prizeDescription: 'Mega Prize Winner - $10,000',
    });

    // Real Mega Prize: If pool exceeds $10,500, award $10,000 to real winner
    if (distributionPool > 10500 && draw.tickets.length > 0) {
      const megaWinner = this.selectRandomWinner(draw.tickets);
      if (megaWinner) {
        winners.push({
          drawId,
          ticketId: megaWinner.id,
          userId: megaWinner.userId,
          winnerType: 'special_cash',
          prizeAmount: '10000.00',
          prizeDescription: 'Mega Prize Winner - $10,000',
        });
        remainingPool -= 10000;
      }
    }

    // Remaining pool distribution: 50% at $10 per winner, 50% at $5 per winner
    const halfPool = remainingPool / 2;
    
    // $10 winners from first half of pool
    const tenDollarWinnerCount = Math.floor(halfPool / 10);
    if (tenDollarWinnerCount > 0) {
      const tenDollarWinners = this.selectMultipleRandomWinners(draw.tickets, tenDollarWinnerCount, winners);
      tenDollarWinners.forEach(ticket => {
        winners.push({
          drawId,
          ticketId: ticket.id,
          userId: ticket.userId,
          winnerType: 'regular',
          prizeAmount: '10.00',
          prizeDescription: 'Daily Draw Winner - $10',
        });
      });
    }

    // $5 winners from second half of pool
    const fiveDollarWinnerCount = Math.floor(halfPool / 5);
    if (fiveDollarWinnerCount > 0) {
      const fiveDollarWinners = this.selectMultipleRandomWinners(draw.tickets, fiveDollarWinnerCount, winners);
      fiveDollarWinners.forEach(ticket => {
        winners.push({
          drawId,
          ticketId: ticket.id,
          userId: ticket.userId,
          winnerType: 'regular',
          prizeAmount: '5.00',
          prizeDescription: 'Daily Draw Winner - $5',
        });
      });
    }

    await this.distributeWinnings(drawId, winners);
  }

  /**
   * Execute a weekly lottery draw with motorcycle prizes
   */
  async executeWeeklyDraw(drawId: string): Promise<void> {
    const draw = await this.getDrawWithTickets(drawId);
    if (!draw || draw.status !== 'scheduled') {
      throw new Error('Invalid draw or draw already executed');
    }

    const totalPrizePool = parseFloat(draw.totalPrizePool || "0");
    const platformFees = totalPrizePool * this.rules.platformFeePercentage;
    const distributionPool = totalPrizePool * this.rules.distributionPercentage;

    await db.update(draws)
      .set({
        platformFees: platformFees.toFixed(2),
        distributionPool: distributionPool.toFixed(2),
        status: 'active',
        executedAt: new Date(),
      })
      .where(eq(draws.id, drawId));

    let remainingPool = distributionPool;
    const winners: InsertDrawWinner[] = [];

    // Marketing Strategy: Always show fake motorcycle winner
    const fakeUserId = await this.createFakeDisplayUser();
    winners.push({
      drawId,
      ticketId: null,
      userId: fakeUserId,
      winnerType: 'motorcycle_display',
      prizeAmount: '5000.00',
      prizeDescription: 'Yamaha R15 Motorcycle Winner',
    });

    // Real Motorcycle prizes based on pool size and real participants
    let motorcycleWinners = 0;
    if (distributionPool > 22000) {
      motorcycleWinners = 4; // 4 motorcycles at $5,000 each
    } else if (distributionPool > 10500) {
      motorcycleWinners = 2; // 2 motorcycles at $5,000 each
    }

    // Award motorcycles to real users if pool allows and participants exist
    if (motorcycleWinners > 0 && draw.tickets.length > 0) {
      const motorcycleWinnerTickets = this.selectMultipleRandomWinners(draw.tickets, motorcycleWinners);
      motorcycleWinnerTickets.forEach(ticket => {
        winners.push({
          drawId,
          ticketId: ticket.id,
          userId: ticket.userId,
          winnerType: 'motorcycle',
          prizeAmount: '5000.00',
          prizeDescription: 'Yamaha R15 Motorcycle',
        });
      });
      remainingPool -= motorcycleWinnerTickets.length * 5000;
    }

    // Remaining pool: $20 per winner (dynamic count)
    const twentyDollarWinnerCount = Math.floor(remainingPool / 20);
    if (twentyDollarWinnerCount > 0) {
      const twentyDollarWinners = this.selectMultipleRandomWinners(draw.tickets, twentyDollarWinnerCount, winners);
      twentyDollarWinners.forEach(ticket => {
        winners.push({
          drawId,
          ticketId: ticket.id,
          userId: ticket.userId,
          winnerType: 'regular',
          prizeAmount: '20.00',
          prizeDescription: 'Weekly Draw Winner - $20',
        });
      });
    }

    await this.distributeWinnings(drawId, winners);
  }

  /**
   * Execute a monthly lottery draw with iPhone and mystery box prizes
   */
  async executeMonthlyDraw(drawId: string): Promise<void> {
    const draw = await this.getDrawWithTickets(drawId);
    if (!draw || draw.status !== 'scheduled') {
      throw new Error('Invalid draw or draw already executed');
    }

    const totalPrizePool = parseFloat(draw.totalPrizePool || "0");
    const platformFees = totalPrizePool * this.rules.platformFeePercentage;
    const distributionPool = totalPrizePool * this.rules.distributionPercentage;

    await db.update(draws)
      .set({
        platformFees: platformFees.toFixed(2),
        distributionPool: distributionPool.toFixed(2),
        status: 'active',
        executedAt: new Date(),
      })
      .where(eq(draws.id, drawId));

    let remainingPool = distributionPool;
    const winners: InsertDrawWinner[] = [];

    // Marketing Strategy: Always show fake special winners
    const fakeUserId = await this.createFakeDisplayUser();
    winners.push({
      drawId,
      ticketId: null,
      userId: fakeUserId,
      winnerType: 'special_cash_display',
      prizeAmount: '20000.00',
      prizeDescription: 'Monthly Mega Prize Winner - $20,000',
    });

    // Real Special prizes based on pool size and real participants
    if (distributionPool > 50000 && draw.tickets.length > 0) {
      // $20,000 cash winner
      const cashWinner = this.selectRandomWinner(draw.tickets);
      if (cashWinner) {
        winners.push({
          drawId,
          ticketId: cashWinner.id,
          userId: cashWinner.userId,
          winnerType: 'special_cash',
          prizeAmount: '20000.00',
          prizeDescription: 'Monthly Mega Prize - $20,000',
        });
        remainingPool -= 20000;
      }

      // 5 mystery gift boxes at $2,000+ each
      const mysteryWinners = this.selectMultipleRandomWinners(draw.tickets, 5, winners);
      if (mysteryWinners.length > 0) {
        mysteryWinners.forEach(ticket => {
          winners.push({
            drawId,
            ticketId: ticket.id,
            userId: ticket.userId,
            winnerType: 'mystery_box',
            prizeAmount: '2000.00',
            prizeDescription: 'Mystery Gift Box ($2,000+)',
          });
        });
        remainingPool -= mysteryWinners.length * 2000;
      }

      // 10 latest iPhones at $1,500 each
      const iphoneWinners = this.selectMultipleRandomWinners(draw.tickets, 10, winners);
      if (iphoneWinners.length > 0) {
        iphoneWinners.forEach(ticket => {
          winners.push({
            drawId,
            ticketId: ticket.id,
            userId: ticket.userId,
            winnerType: 'iphone',
            prizeAmount: '1500.00',
            prizeDescription: 'iPhone 15 Pro Max',
          });
        });
        remainingPool -= iphoneWinners.length * 1500;
      }

    } else if (distributionPool > 30000 && draw.tickets.length > 0) {
      // $20,000 cash winner
      const cashWinner = this.selectRandomWinner(draw.tickets);
      if (cashWinner) {
        winners.push({
          drawId,
          ticketId: cashWinner.id,
          userId: cashWinner.userId,
          winnerType: 'special_cash',
          prizeAmount: '20000.00',
          prizeDescription: 'Monthly Mega Prize - $20,000',
        });
        remainingPool -= 20000;
      }

      // 5 latest iPhones at $1,500 each
      const iphoneWinners = this.selectMultipleRandomWinners(draw.tickets, 5, winners);
      if (iphoneWinners.length > 0) {
        iphoneWinners.forEach(ticket => {
          winners.push({
            drawId,
            ticketId: ticket.id,
            userId: ticket.userId,
            winnerType: 'iphone',
            prizeAmount: '1500.00',
            prizeDescription: 'iPhone 15 Pro Max',
          });
        });
        remainingPool -= iphoneWinners.length * 1500;
      }
    }

    // Remaining pool: $50 per winner (dynamic count)
    const fiftyDollarWinnerCount = Math.floor(remainingPool / 50);
    if (fiftyDollarWinnerCount > 0) {
      const fiftyDollarWinners = this.selectMultipleRandomWinners(draw.tickets, fiftyDollarWinnerCount, winners);
      fiftyDollarWinners.forEach(ticket => {
        winners.push({
          drawId,
          ticketId: ticket.id,
          userId: ticket.userId,
          winnerType: 'regular',
          prizeAmount: '50.00',
          prizeDescription: 'Monthly Draw Winner - $50',
        });
      });
    }

    await this.distributeWinnings(drawId, winners);
  }

  /**
   * Handle the special rule: 10 daily tickets = 1 free monthly ticket
   */
  async handleMonthlyTicketBonus(userId: string, dailyTicketsPurchased: number): Promise<void> {
    const bonusTickets = Math.floor(dailyTicketsPurchased / 10);
    
    if (bonusTickets > 0) {
      // Find next monthly draw
      const nextMonthlyDraw = await db.query.draws.findFirst({
        where: and(
          eq(draws.status, 'scheduled')
        ),
        with: {
          lottery: true
        },
        orderBy: draws.drawDate
      });

      if (nextMonthlyDraw && nextMonthlyDraw.lottery.type === 'monthly') {
        // Create free monthly tickets
        for (let i = 0; i < bonusTickets; i++) {
          const ticketNumber = await this.generateUniqueTicketNumber(nextMonthlyDraw.id);
          await db.insert(tickets).values({
            userId,
            drawId: nextMonthlyDraw.id,
            numbers: [ticketNumber],
            ticketNumber,
            isFreeTicket: true,
            prizeAmount: '0.00',
          });
        }

        // Record the bonus
        await db.insert(monthlyTicketBonuses).values({
          userId,
          dailyTicketsPurchased,
          bonusTicketsAwarded: bonusTickets,
          nextMonthlyDrawId: nextMonthlyDraw.id,
        });
      }
    }
  }

  /**
   * Secure random winner selection using crypto.randomInt
   */
  private selectRandomWinner(ticketPool: Ticket[], excludeWinners: InsertDrawWinner[] = []): Ticket | null {
    const excludeTicketIds = new Set(excludeWinners.map(w => w.ticketId));
    const availableTickets = ticketPool.filter(t => !excludeTicketIds.has(t.id));
    
    if (availableTickets.length === 0) return null;
    
    // Use only integer ticket numbers for fair distribution
    const integerTickets = availableTickets.filter(t => Number.isInteger(t.ticketNumber));
    if (integerTickets.length === 0) return null;
    
    const randomIndex = randomInt(0, integerTickets.length);
    return integerTickets[randomIndex];
  }

  /**
   * Select multiple random winners without duplicates
   */
  private selectMultipleRandomWinners(
    ticketPool: Ticket[], 
    count: number, 
    excludeWinners: InsertDrawWinner[] = []
  ): Ticket[] {
    const winners: Ticket[] = [];
    const excludeTicketIds = new Set(excludeWinners.map(w => w.ticketId));
    
    for (let i = 0; i < count; i++) {
      const winner = this.selectRandomWinner(ticketPool, [...excludeWinners, ...winners.map(w => ({
        drawId: '',
        ticketId: w.id,
        userId: w.userId,
        winnerType: 'regular' as const,
        prizeAmount: '0.00'
      }))]);
      
      if (winner) {
        winners.push(winner);
        excludeTicketIds.add(winner.id);
      } else {
        break; // No more available tickets
      }
    }
    
    return winners;
  }

  /**
   * Distribute winnings to all winners
   */
  private async distributeWinnings(drawId: string, winners: InsertDrawWinner[]): Promise<void> {
    if (winners.length === 0) {
      // No tickets sold - create fake winner entry
      // No tickets sold - update draw as completed without winners
      await db.update(draws)
        .set({ 
          status: 'completed',
          winningNumbers: [0] // Fake winning number
        })
        .where(eq(draws.id, drawId));
      return;
      
      await db.update(draws)
        .set({ status: 'completed' })
        .where(eq(draws.id, drawId));
      return;
    }

    // Insert all winners
    await db.insert(drawWinners).values(winners);

    // Distribute prizes to winners (skip fake winners)
    for (const winner of winners) {
      // Skip fake display winners - they don't get real money
      if (winner.ticketId === null) {
        // Mark fake winners as distributed for display purposes
        await db.update(drawWinners)
          .set({
            isDistributed: true,
            distributedAt: new Date(),
          })
          .where(and(
            eq(drawWinners.drawId, drawId),
            eq(drawWinners.userId, winner.userId)
          ));
        continue;
      }

      if (parseFloat(winner.prizeAmount || '0') > 0) {
        // Update user wallet
        await db.update(wallets)
          .set({
            balance: sql`balance + ${winner.prizeAmount || '0'}`,
            totalWinnings: sql`total_winnings + ${winner.prizeAmount || '0'}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, winner.userId));

        // Create transaction record
        const userWallet = await db.query.wallets.findFirst({
          where: eq(wallets.userId, winner.userId)
        });

        if (userWallet) {
          await db.insert(transactions).values({
            walletId: userWallet.id,
            type: 'prize_win',
            amount: winner.prizeAmount || '0.00',
            description: `Lottery Prize: ${winner.prizeDescription}`,
            status: 'confirmed',
          });
        }

        // Mark as distributed (only for real winners with ticketId)
        if (winner.ticketId) {
          await db.update(drawWinners)
            .set({
              isDistributed: true,
              distributedAt: new Date(),
            })
            .where(and(
              eq(drawWinners.drawId, drawId),
              eq(drawWinners.ticketId, winner.ticketId)
            ));
        }
      }
    }

    // Generate realistic winning numbers for display
    const winningNumbers = this.generateWinningNumbers();
    
    // Mark draw as completed with winning numbers
    await db.update(draws)
      .set({ 
        status: 'completed',
        winningNumbers: winningNumbers
      })
      .where(eq(draws.id, drawId));
  }

  /**
   * Get draw with associated tickets
   */
  private async getDrawWithTickets(drawId: string) {
    return await db.query.draws.findFirst({
      where: eq(draws.id, drawId),
      with: {
        tickets: true,
        lottery: true,
      },
    });
  }

  /**
   * Generate realistic winning numbers for display
   */
  private generateWinningNumbers(): number[] {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 50) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  /**
   * Generate unique ticket number for a draw
   */
  private async generateUniqueTicketNumber(drawId: string): Promise<number> {
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (attempts < maxAttempts) {
      const ticketNumber = randomInt(1, 1000000); // 1 to 1,000,000
      
      const existing = await db.query.tickets.findFirst({
        where: and(
          eq(tickets.drawId, drawId),
          eq(tickets.ticketNumber, ticketNumber)
        )
      });
      
      if (!existing) {
        return ticketNumber;
      }
      
      attempts++;
    }
    
    throw new Error('Unable to generate unique ticket number after maximum attempts');
  }

  /**
   * Generate realistic ticket hash for display (like A7B9X3M8)
   */
  private generateFakeTicketHash(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hash = '';
    for (let i = 0; i < 8; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Create fake display user for fake winners (now using ticket hashes)
   */
  private async createFakeDisplayUser(): Promise<string> {
    const ticketHash = this.generateFakeTicketHash();
    
    // Create a fake user ID that doesn't conflict with real users
    const fakeUserId = `fake_display_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await db.insert(users).values({
        id: fakeUserId,
        email: `ticket_${ticketHash.toLowerCase()}@system.lottery`,
        firstName: `Ticket`,
        lastName: `#${ticketHash}`,
        profileImageUrl: null,
        isAdmin: false
      });
    } catch (error) {
      // User might already exist, that's OK
      console.log('Fake display user creation skipped (may already exist)');
    }
    
    return fakeUserId;
  }

  /**
   * Generate fake ticket number that doesn't conflict with real tickets
   */
  private async generateFakeTicketNumber(drawId: string): Promise<number> {
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (attempts < maxAttempts) {
      const fakeTicketNumber = randomInt(100000, 999999); // 6-digit fake ticket number
      
      // Check if any real ticket has this number
      const existing = await db.query.tickets.findFirst({
        where: and(
          eq(tickets.drawId, drawId),
          eq(tickets.ticketNumber, fakeTicketNumber)
        )
      });
      
      if (!existing) {
        return fakeTicketNumber;
      }
      
      attempts++;
    }
    
    // Fallback to timestamp-based number if all attempts fail
    return parseInt(Date.now().toString().slice(-6));
  }
}

// Export singleton instance
export const lotteryDrawingService = new LotteryDrawingService();