import { storage } from "../storage";

class LotteryService {
  async initializeLotteries() {
    const existingLotteries = await storage.getLotteries();
    
    if (existingLotteries.length === 0) {
      // Create default lottery types
      await storage.createLottery({
        name: "Daily Draw",
        type: "daily",
        ticketPrice: "5.00",
        prizePool: "50000.00",
      });

      await storage.createLottery({
        name: "Weekly Draw", 
        type: "weekly",
        ticketPrice: "20.00",
        prizePool: "25000.00",
      });

      await storage.createLottery({
        name: "Monthly Draw",
        type: "monthly", 
        ticketPrice: "50.00",
        prizePool: "50000.00",
      });
    }
  }

  generateWinningNumbers(): number[] {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 50) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  async triggerDraw(drawId: string) {
    const draw = await storage.getDraw(drawId);
    if (!draw) {
      throw new Error("Draw not found");
    }

    if (draw.status !== "scheduled") {
      throw new Error("Draw is not in scheduled status");
    }

    // Get all tickets for this draw
    const tickets = await storage.getTicketsForDraw(drawId);

    if (tickets.length === 0) {
      // No tickets sold, draw completes with no winner
      await storage.updateDraw(drawId, {
        status: "completed",
        winningNumbers: [],
        winnerId: null,
        prizeAmount: "0.00",
      });
      
      return {
        drawId,
        winningNumbers: [],
        winner: null,
      };
    }

    // Select a random ticket from user tickets and use its numbers as winning numbers
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const selectedTicket = tickets[randomIndex];
    const winningNumbers = selectedTicket.numbers;

    // Find all winners (tickets with exact same numbers)
    const winners = tickets.filter(ticket => 
      this.checkWinningTicket(ticket.numbers, winningNumbers)
    );

    // Use the first winner for public display
    const firstWinner = winners[0];

    // Update draw status
    await storage.updateDraw(drawId, {
      status: "completed",
      winningNumbers,
    });

    // Update all winning tickets and wallets
    for (const winner of winners) {
      await storage.updateTicketWinningStatus(winner.id, true, draw.prizeAmount || "0.00");
      
      // Add prize to winner's wallet
      await storage.updateWalletBalance(winner.userId, draw.prizeAmount || "0.00");
      
      // Record prize transaction
      const wallet = await storage.getWallet(winner.userId);
      if (wallet) {
        await storage.createTransaction({
          walletId: wallet.id,
          type: "prize_win",
          amount: draw.prizeAmount || "0.00",
          description: `Prize winnings for draw ${drawId}`,
        });
      }
    }

    return {
      drawId,
      winningNumbers,
      winner: firstWinner ? {
        userId: firstWinner.userId,
        ticketId: firstWinner.id,
        prizeAmount: draw.prizeAmount,
      } : null,
      totalWinners: winners.length,
    };
  }

  private checkWinningTicket(ticketNumbers: number[], winningNumbers: number[]): boolean {
    // For this lottery, we'll require exact match of all 5 numbers
    return ticketNumbers.length === winningNumbers.length &&
           ticketNumbers.every(num => winningNumbers.includes(num));
  }

  async createScheduledDraws() {
    const lotteries = await storage.getLotteries();
    const now = new Date();

    for (const lottery of lotteries) {
      // Check if there's already an upcoming draw for this lottery
      const existingDraws = await storage.getDrawsForLottery(lottery.id);
      const hasUpcomingDraw = existingDraws.some(draw => 
        draw.status === "scheduled" && new Date(draw.drawDate) > now
      );

      if (!hasUpcomingDraw) {
        let nextDrawDate = new Date();

        if (lottery.type === "daily") {
          nextDrawDate.setHours(21, 0, 0, 0); // 9 PM
          if (nextDrawDate <= now) {
            nextDrawDate.setDate(nextDrawDate.getDate() + 1);
          }
        } else if (lottery.type === "weekly") {
          // Next Sunday at 8 PM
          const daysUntilSunday = (7 - nextDrawDate.getDay()) % 7;
          if (daysUntilSunday === 0 && nextDrawDate.getHours() >= 20) {
            nextDrawDate.setDate(nextDrawDate.getDate() + 7);
          } else {
            nextDrawDate.setDate(nextDrawDate.getDate() + daysUntilSunday);
          }
          nextDrawDate.setHours(20, 0, 0, 0); // 8 PM
        } else if (lottery.type === "monthly") {
          // Last Sunday of the month at 8 PM
          const lastDayOfMonth = new Date(nextDrawDate.getFullYear(), nextDrawDate.getMonth() + 1, 0);
          const lastSunday = new Date(lastDayOfMonth);
          lastSunday.setDate(lastDayOfMonth.getDate() - lastDayOfMonth.getDay());
          lastSunday.setHours(20, 0, 0, 0);
          
          if (lastSunday <= now) {
            // Next month's last Sunday
            const nextMonth = new Date(nextDrawDate.getFullYear(), nextDrawDate.getMonth() + 2, 0);
            const nextLastSunday = new Date(nextMonth);
            nextLastSunday.setDate(nextMonth.getDate() - nextMonth.getDay());
            nextLastSunday.setHours(20, 0, 0, 0);
            nextDrawDate = nextLastSunday;
          } else {
            nextDrawDate = lastSunday;
          }
        }

        await storage.createDraw({
          lotteryId: lottery.id,
          drawDate: nextDrawDate,
          status: "scheduled",
          prizeAmount: lottery.prizePool,
        });
      }
    }
  }
}


export const lotteryService = new LotteryService();
