import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTicketSchema, insertTransactionSchema, insertCryptoAddressSchema, insertWithdrawalRequestSchema } from "@shared/schema";
import { lotteryService } from "./services/lotteryService";
import { lotteryDrawingService } from "./services/lotteryDrawingService";
import { initializeDrawScheduler } from "./services/drawScheduler";
import { cryptoService } from "./services/cryptoService";
import { emailService } from "./services/emailService";
import { gameService } from "./services/gameService";
import { newGamesService } from "./services/newGamesService";
import { gameScheduler } from "./services/gameScheduler";
import { 
  insertSurpriseDrawSchema, 
  insertMysterySearchRegistrationSchema, 
  insertMysterySearchSubmissionSchema,
  insertTryYourLuckParticipantSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Include wallet information
      const wallet = await storage.getWallet(userId);
      res.json({ ...user, wallet });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Lottery routes
  app.get('/api/lotteries', async (req, res) => {
    try {
      const lotteries = await storage.getLotteries();
      res.json(lotteries);
    } catch (error) {
      console.error("Error fetching lotteries:", error);
      res.status(500).json({ message: "Failed to fetch lotteries" });
    }
  });

  // Draw routes
  app.get('/api/draws/active', async (req, res) => {
    try {
      const draws = await storage.getActiveDraws();
      res.json(draws);
    } catch (error) {
      console.error("Error fetching active draws:", error);
      res.status(500).json({ message: "Failed to fetch active draws" });
    }
  });

  app.get('/api/draws/upcoming', async (req, res) => {
    try {
      const draws = await storage.getUpcomingDraws();
      res.json(draws);
    } catch (error) {
      console.error("Error fetching upcoming draws:", error);
      res.status(500).json({ message: "Failed to fetch upcoming draws" });
    }
  });

  app.get('/api/draws/completed', async (req, res) => {
    try {
      const draws = await storage.getCompletedDraws();
      res.json(draws);
    } catch (error) {
      console.error("Error fetching completed draws:", error);
      res.status(500).json({ message: "Failed to fetch completed draws" });
    }
  });

  // Manual draw trigger (for testing and admin)
  app.post('/api/draws/:drawId/trigger', isAuthenticated, async (req: any, res) => {
    try {
      const { drawId } = req.params;
      const result = await lotteryService.triggerDraw(drawId);
      res.json({
        message: "Draw completed successfully",
        result,
      });
    } catch (error) {
      console.error("Error triggering draw:", error);
      res.status(500).json({ message: "Failed to trigger draw", error: error.message });
    }
  });

  // Test endpoint to trigger lottery drawing service directly
  app.post('/api/test/draw/:drawId/execute', async (req, res) => {
    try {
      const { drawId } = req.params;
      const { lotteryType } = req.body;
      
      if (lotteryType === 'daily') {
        await lotteryDrawingService.executeDailyDraw(drawId);
      } else if (lotteryType === 'weekly') {
        await lotteryDrawingService.executeWeeklyDraw(drawId);
      } else if (lotteryType === 'monthly') {
        await lotteryDrawingService.executeMonthlyDraw(drawId);
      } else {
        return res.status(400).json({ message: "Invalid lottery type" });
      }
      
      res.json({
        message: `${lotteryType} draw executed successfully`,
        drawId,
      });
    } catch (error) {
      console.error("Error executing draw:", error);
      res.status(500).json({ message: "Failed to execute draw", error: error.message });
    }
  });

  // Specific draw endpoints for daily, weekly, monthly as requested
  app.get('/api/draw/daily', async (req, res) => {
    try {
      const lotteries = await storage.getLotteries();
      const dailyLottery = lotteries.find(l => l.type === 'daily');
      
      if (!dailyLottery) {
        return res.status(404).json({ message: "Daily lottery not found" });
      }

      const draws = await storage.getDrawsForLottery(dailyLottery.id);
      const upcomingDraw = draws.find(d => d.status === 'scheduled' && new Date(d.drawDate) > new Date());
      const latestCompleted = draws.find(d => d.status === 'completed');

      res.json({
        lottery: dailyLottery,
        upcomingDraw,
        latestCompleted,
        allDraws: draws
      });
    } catch (error) {
      console.error("Error fetching daily draw:", error);
      res.status(500).json({ message: "Failed to fetch daily draw" });
    }
  });

  app.get('/api/draw/weekly', async (req, res) => {
    try {
      const lotteries = await storage.getLotteries();
      const weeklyLottery = lotteries.find(l => l.type === 'weekly');
      
      if (!weeklyLottery) {
        return res.status(404).json({ message: "Weekly lottery not found" });
      }

      const draws = await storage.getDrawsForLottery(weeklyLottery.id);
      const upcomingDraw = draws.find(d => d.status === 'scheduled' && new Date(d.drawDate) > new Date());
      const latestCompleted = draws.find(d => d.status === 'completed');

      res.json({
        lottery: weeklyLottery,
        upcomingDraw,
        latestCompleted,
        allDraws: draws
      });
    } catch (error) {
      console.error("Error fetching weekly draw:", error);
      res.status(500).json({ message: "Failed to fetch weekly draw" });
    }
  });

  app.get('/api/draw/monthly', async (req, res) => {
    try {
      const lotteries = await storage.getLotteries();
      const monthlyLottery = lotteries.find(l => l.type === 'monthly');
      
      if (!monthlyLottery) {
        return res.status(404).json({ message: "Monthly lottery not found" });
      }

      const draws = await storage.getDrawsForLottery(monthlyLottery.id);
      const upcomingDraw = draws.find(d => d.status === 'scheduled' && new Date(d.drawDate) > new Date());
      const latestCompleted = draws.find(d => d.status === 'completed');

      res.json({
        lottery: monthlyLottery,
        upcomingDraw,
        latestCompleted,
        allDraws: draws
      });
    } catch (error) {
      console.error("Error fetching monthly draw:", error);
      res.status(500).json({ message: "Failed to fetch monthly draw" });
    }
  });

  // Ticket routes
  app.get('/api/tickets/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tickets = await storage.getUserTickets(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/daily-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date();
      const count = await storage.getUserDailyTicketCount(userId, today);
      res.json({ count, nextBonus: 10 - (count % 10) });
    } catch (error) {
      console.error("Error fetching daily ticket count:", error);
      res.status(500).json({ message: "Failed to fetch daily ticket count" });
    }
  });

  app.post('/api/tickets/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Generate unique ticket number (integer for fair distribution)
      const ticketNumber = parseInt(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
      
      const ticketData = insertTicketSchema.parse({
        ...req.body,
        userId,
        ticketNumber,
        isWinner: false,
        prizeAmount: "0.00",
        isFreeTicket: false,
      });

      // Validate draw exists and is active
      const draw = await storage.getDraw(ticketData.drawId);
      if (!draw || draw.status !== "scheduled") {
        return res.status(400).json({ message: "Invalid or inactive draw" });
      }

      // Check if user already has ticket with same numbers for this draw
      const existingTickets = await storage.getUserTickets(userId);
      const duplicateTicket = existingTickets.find(ticket => 
        ticket.drawId === ticketData.drawId && 
        JSON.stringify(ticket.numbers.sort()) === JSON.stringify(ticketData.numbers.sort())
      );
      
      if (duplicateTicket) {
        return res.status(400).json({ message: "You already have a ticket with these numbers for this draw" });
      }

      // Get lottery info for pricing
      const lottery = await storage.getLottery(draw.lotteryId);
      if (!lottery) {
        return res.status(400).json({ message: "Lottery not found" });
      }

      // Handle multiple ticket purchase
      const quantity = req.body.quantity || 1;
      const totalCost = parseFloat(lottery.ticketPrice) * quantity;

      // Check user wallet balance
      const wallet = await storage.getWallet(userId);
      if (!wallet || parseFloat(wallet.balance || '0') < totalCost) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Create multiple tickets for quantity > 1
      const createdTickets = [];
      
      for (let i = 0; i < quantity; i++) {
        // Generate unique ticket number for each ticket
        const uniqueTicketNumber = parseInt(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')) + i;
        
        // For quantity > 1, generate different random numbers for each ticket
        let numbersToUse = ticketData.numbers;
        if (quantity > 1 && i > 0) {
          // Generate new random numbers for additional tickets
          const newNumbers: number[] = [];
          while (newNumbers.length < 5) {
            const num = Math.floor(Math.random() * 50) + 1;
            if (!newNumbers.includes(num)) {
              newNumbers.push(num);
            }
          }
          numbersToUse = newNumbers.sort((a, b) => a - b);
        }
        
        const ticketForCreation = {
          ...ticketData,
          numbers: numbersToUse,
          ticketNumber: uniqueTicketNumber,
        };
        
        const ticket = await storage.createTicket(ticketForCreation);
        createdTickets.push(ticket);
      }

      // Deduct total cost from wallet
      await storage.updateWalletBalance(userId, `-${totalCost.toFixed(2)}`);

      // Record transaction
      await storage.createTransaction({
        walletId: wallet.id,
        type: "ticket_purchase",
        amount: `-${totalCost.toFixed(2)}`,
        description: `${quantity} ticket(s) purchase for ${lottery.name} draw`,
      });

      // Check for monthly bonus tickets if this is a daily draw purchase
      let bonusMessage = "";
      if (lottery.type === 'daily') {
        const today = new Date();
        const currentDailyTicketCount = await storage.getUserDailyTicketCount(userId, today);
        
        // Check if user just reached a multiple of 10
        if (currentDailyTicketCount % 10 === 0 && currentDailyTicketCount > 0) {
          // Find upcoming monthly draw
          const upcomingDraws = await storage.getUpcomingDraws();
          const monthlyDraw = upcomingDraws.find(draw => draw.lottery.type === 'monthly');
          
          if (monthlyDraw) {
            // Create free monthly ticket with random numbers
            const freeNumbers: number[] = [];
            while (freeNumbers.length < 5) {
              const num = Math.floor(Math.random() * 50) + 1;
              if (!freeNumbers.includes(num)) {
                freeNumbers.push(num);
              }
            }
            
            const freeTicketNumber = parseInt(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')) + 999;
            
            const freeTicket = await storage.createTicket({
              userId,
              drawId: monthlyDraw.id,
              numbers: freeNumbers.sort((a, b) => a - b),
              ticketNumber: freeTicketNumber,
              isWinner: false,
              prizeAmount: "0.00",
              isFreeTicket: true,
            });

            bonusMessage = ` 🎉 Congratulations! You've purchased ${currentDailyTicketCount} daily tickets and earned a FREE Monthly Lottery ticket!`;
            createdTickets.push(freeTicket);
          }
        }
      }

      res.json({ 
        tickets: createdTickets, 
        message: `Successfully purchased ${quantity} ticket(s)${bonusMessage}`,
        totalCost: totalCost.toFixed(2),
        bonusTicket: bonusMessage ? true : false
      });
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      res.status(500).json({ message: "Failed to purchase ticket" });
    }
  });

  // Wallet routes
  app.get('/api/wallet/details', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching wallet details:", error);
      res.status(500).json({ message: "Failed to fetch wallet details" });
    }
  });

  app.get('/api/wallet/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/wallet/withdrawal-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getUserWithdrawalRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  app.post('/api/wallet/request-withdrawal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, method, recipientDetails } = req.body;

      if (!amount || !method || !recipientDetails) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const requestAmount = parseFloat(amount);
      if (requestAmount < 10) {
        return res.status(400).json({ message: "Minimum withdrawal amount is $10" });
      }

      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const walletBalance = parseFloat(wallet.balance || '0');
      if (requestAmount > walletBalance) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          availableBalance: wallet.balance
        });
      }

      // Create withdrawal request
      const withdrawalRequest = await storage.createWithdrawalRequest({
        amount,
        method,
        recipientDetails,
      }, userId);

      res.json(withdrawalRequest);
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  app.post('/api/wallet/deposit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      await storage.updateWalletBalance(userId, amount);

      await storage.createTransaction({
        walletId: wallet.id,
        type: "deposit",
        amount,
        description: "Wallet deposit",
      });

      const updatedWallet = await storage.getWallet(userId);
      res.json(updatedWallet);
    } catch (error) {
      console.error("Error depositing to wallet:", error);
      res.status(500).json({ message: "Failed to deposit" });
    }
  });

  // Crypto deposit routes
  app.get('/api/crypto/addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const addresses = await storage.getUserCryptoAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching crypto addresses:", error);
      res.status(500).json({ message: "Failed to fetch crypto addresses" });
    }
  });

  app.post('/api/crypto/generate-address', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { network } = req.body;

      if (!['ethereum', 'bsc', 'polygon'].includes(network)) {
        return res.status(400).json({ message: "Invalid network" });
      }

      // Check if address already exists
      const existingAddress = await storage.getCryptoAddress(userId, network);
      if (existingAddress) {
        return res.json(existingAddress);
      }

      // Generate new address
      const address = cryptoService.generateDepositAddress(userId, network);
      const qrCode = await cryptoService.generateDepositQR(address, network);

      const cryptoAddress = await storage.createCryptoAddress({
        userId,
        network,
        address,
        qrCode,
      });

      res.json(cryptoAddress);
    } catch (error) {
      console.error("Error generating crypto address:", error);
      res.status(500).json({ message: "Failed to generate crypto address" });
    }
  });

  app.post('/api/crypto/verify-deposit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { txHash, network, expectedAddress } = req.body;

      if (!txHash || !network || !expectedAddress) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify transaction on blockchain
      const verification = await cryptoService.verifyTransaction(txHash, network, expectedAddress);
      
      if (!verification.isValid) {
        return res.status(400).json({ message: "Invalid transaction" });
      }

      // Get user wallet
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      // Convert USDT to credits and update balance
      const credits = cryptoService.convertUSDTToCredits(verification.amount!);
      await storage.updateWalletBalance(userId, credits.toString());

      // Create transaction record
      await storage.createTransaction({
        walletId: wallet.id,
        type: "crypto_deposit",
        amount: credits.toString(),
        description: `USDT deposit from ${network.toUpperCase()}`,
        cryptoNetwork: network,
        cryptoTxHash: txHash,
        cryptoAddress: expectedAddress,
        status: "confirmed",
      });

      res.json({
        success: true,
        amount: verification.amount,
        credits,
        txHash,
      });
    } catch (error) {
      console.error("Error verifying crypto deposit:", error);
      res.status(500).json({ message: "Failed to verify deposit" });
    }
  });

  // Crypto withdrawal route
  app.post('/api/crypto/withdraw', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, address, network } = req.body;

      // Validate input
      if (!amount || !address || !network) {
        return res.status(400).json({ message: "Amount, address, and network are required" });
      }

      // TODO: Implement crypto withdrawal functionality
      res.json({ message: "Crypto withdrawal not yet implemented" });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Withdrawal request routes
  app.post('/api/withdrawals/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = insertWithdrawalRequestSchema.parse(req.body);
      
      // Check user's wallet balance
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const requestAmount = parseFloat(requestData.amount);
      const walletBalance = parseFloat(wallet.balance || '0');

      if (requestAmount > walletBalance) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          availableBalance: wallet.balance
        });
      }

      if (requestAmount < 10) {
        return res.status(400).json({ message: "Minimum withdrawal amount is $10" });
      }

      // Create withdrawal request
      const withdrawalRequest = await storage.createWithdrawalRequest(requestData, userId);

      // Get user for email
      const user = await storage.getUser(userId);
      if (user?.email) {
        await emailService.sendWithdrawalRequestEmail(
          user.email,
          user.firstName || user.email,
          requestData.amount,
          withdrawalRequest.id
        );
      }

      res.json(withdrawalRequest);
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  app.get('/api/withdrawals/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const withdrawals = await storage.getUserWithdrawalRequests(userId);
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching user withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/draw/trigger', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { drawId } = req.body;
      const result = await lotteryService.triggerDraw(drawId);
      res.json(result);
    } catch (error) {
      console.error("Error triggering draw:", error);
      res.status(500).json({ message: "Failed to trigger draw" });
    }
  });

  // Enhanced admin endpoints for better management
  app.get('/api/admin/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all tickets with user and draw information
      const allTickets = [];
      const users = await storage.getAllUsers();
      
      for (const ticketUser of users) {
        const userTickets = await storage.getUserTickets(ticketUser.id);
        allTickets.push(...userTickets.map(ticket => ({
          ...ticket,
          user: ticketUser
        })));
      }

      res.json(allTickets);
    } catch (error) {
      console.error("Error fetching admin tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/admin/draws', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const upcoming = await storage.getUpcomingDraws();
      const completed = await storage.getCompletedDraws();
      
      res.json({
        upcoming,
        completed,
        all: [...upcoming, ...completed]
      });
    } catch (error) {
      console.error("Error fetching admin draws:", error);
      res.status(500).json({ message: "Failed to fetch draws" });
    }
  });

  // Admin withdrawal management routes
  app.get('/api/admin/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const withdrawals = await storage.getAllWithdrawalRequests();
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching admin withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.post('/api/admin/withdrawals/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { notes } = req.body;

      // Get withdrawal request details
      const withdrawals = await storage.getAllWithdrawalRequests();
      const withdrawal = withdrawals.find(w => w.id === id);
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ message: "Only pending requests can be approved" });
      }

      // Approve the withdrawal
      await storage.approveWithdrawalRequest(id, user.id, notes);

      // Deduct amount from user's wallet
      await storage.deductWalletBalance(withdrawal.userId, withdrawal.amount);

      // Create withdrawal transaction record
      const userWallet = await storage.getWallet(withdrawal.userId);
      if (userWallet) {
        await storage.createTransaction({
          walletId: userWallet.id,
          type: "withdrawal",
          amount: `-${withdrawal.amount}`,
          description: `Withdrawal approved - ${withdrawal.method}`,
          status: "confirmed",
        });
      }

      // Send email notification
      if (withdrawal.user?.email) {
        await emailService.sendWithdrawalStatusEmail(
          withdrawal.user.email,
          withdrawal.user.firstName || withdrawal.user.email,
          withdrawal.amount,
          'approved',
          notes
        );
      }

      res.json({ message: "Withdrawal approved successfully" });
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      res.status(500).json({ message: "Failed to approve withdrawal" });
    }
  });

  app.post('/api/admin/withdrawals/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { notes } = req.body;

      // Get withdrawal request details
      const withdrawals = await storage.getAllWithdrawalRequests();
      const withdrawal = withdrawals.find(w => w.id === id);
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({ message: "Only pending requests can be rejected" });
      }

      // Reject the withdrawal
      await storage.rejectWithdrawalRequest(id, user.id, notes);

      // Send email notification
      if (withdrawal.user?.email) {
        await emailService.sendWithdrawalStatusEmail(
          withdrawal.user.email,
          withdrawal.user.firstName || withdrawal.user.email,
          withdrawal.amount,
          'rejected',
          notes
        );
      }

      res.json({ message: "Withdrawal rejected successfully" });
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      res.status(500).json({ message: "Failed to reject withdrawal" });
    }
  });

  app.post('/api/admin/user/toggle-admin', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.body;
      const targetUser = await storage.getUser(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Toggle admin status using the full user data
      await storage.upsertUser({
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        profileImageUrl: targetUser.profileImageUrl,
        isAdmin: !targetUser.isAdmin
      });

      res.json({ message: "Admin status updated successfully" });
    } catch (error) {
      console.error("Error toggling admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // Trading API routes
  app.get('/api/trading/instruments', async (req, res) => {
    try {
      const instruments = await storage.getTradingInstruments();
      res.json(instruments);
    } catch (error) {
      console.error("Error fetching trading instruments:", error);
      res.status(500).json({ message: "Failed to fetch trading instruments" });
    }
  });

  app.get('/api/trading/prices', async (req, res) => {
    try {
      const { priceService } = await import('./services/priceService');
      const prices = priceService.getAllPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching current prices:", error);
      res.status(500).json({ message: "Failed to fetch current prices" });
    }
  });

  app.post('/api/trading/place-trade', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { instrumentId, direction, amount, expiryMinutes } = req.body;

      // Validate request
      if (!instrumentId || !direction || !amount || !expiryMinutes) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: "Invalid trade direction" });
      }

      const tradeAmount = parseFloat(amount);
      if (isNaN(tradeAmount) || tradeAmount < 1 || tradeAmount > 1000) {
        return res.status(400).json({ message: "Trade amount must be between $1 and $1000" });
      }

      // Check user wallet balance
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const walletBalance = parseFloat(wallet.balance || '0');
      if (walletBalance < tradeAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Get trading instrument
      const instrument = await storage.getTradingInstrument(instrumentId);
      if (!instrument || !instrument.isActive) {
        return res.status(400).json({ message: "Invalid or inactive trading instrument" });
      }

      // Get current price
      const { priceService } = await import('./services/priceService');
      const currentPrice = priceService.getCurrentPrice(instrument.symbol);
      if (!currentPrice) {
        return res.status(503).json({ message: "Price feed unavailable" });
      }

      // Check if price is fresh
      if (priceService.isPriceStale(instrument.symbol)) {
        return res.status(503).json({ message: "Price data is stale" });
      }

      // Calculate expiry and duration
      const entryTime = new Date();
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + parseInt(expiryMinutes));
      const duration = parseInt(expiryMinutes) * 60; // convert to seconds

      // Create binary trade
      const trade = await storage.createBinaryTrade({
        userId,
        instrumentId,
        direction,
        stakeAmount: tradeAmount.toString(),
        entryPrice: currentPrice.price.toString(),
        duration,
        entryTime,
        expiryTime,
        status: 'active',
      });

      // Deduct from user wallet
      await storage.deductWalletBalance(userId, tradeAmount.toString());

      // Create transaction record
      await storage.createTransaction({
        walletId: wallet.id,
        type: "binary_trade",
        amount: (-tradeAmount).toString(),
        description: `Binary trade on ${instrument.symbol} - ${direction.toUpperCase()}`,
        status: "confirmed",
      });

      // Add audit log
      await storage.addTradeAuditLog({
        tradeId: trade.id,
        action: 'trade_placed',
        details: `Trade placed: ${direction} ${instrument.symbol} for $${tradeAmount}`,
      });

      res.json({
        success: true,
        trade,
        currentPrice: currentPrice.price,
        expiryTime,
      });

    } catch (error) {
      console.error("Error placing binary trade:", error);
      res.status(500).json({ message: "Failed to place trade" });
    }
  });

  app.get('/api/trading/my-trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trades = await storage.getUserBinaryTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching user trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.get('/api/trading/active-trades', isAuthenticated, async (req: any, res) => {
    try {
      // Only admin can see all active trades
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const trades = await storage.getActiveBinaryTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching active trades:", error);
      res.status(500).json({ message: "Failed to fetch active trades" });
    }
  });

  // Game Zone Routes
  app.get('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const games = [
        {
          id: 'spin_wheel',
          name: 'spin_wheel',
          displayName: 'Wheel of Fortune',
          description: 'Spin the wheel for instant prizes!',
          icon: '🎡',
          isActive: true,
          cooldownMinutes: 5,
          minReward: '0.10',
          maxReward: '10.00'
        },
        {
          id: 'scratch_card',
          name: 'scratch_card',
          displayName: 'Scratch Card',
          description: 'Scratch away to reveal prizes!',
          icon: '🎫',
          isActive: true,
          cooldownMinutes: 3,
          minReward: '0.05',
          maxReward: '5.00'
        },
        {
          id: 'number_match',
          name: 'number_match',
          displayName: 'Number Match',
          description: 'Pick 3 numbers and win big!',
          icon: '🔢',
          isActive: true,
          cooldownMinutes: 10,
          minReward: '0.20',
          maxReward: '25.00'
        }
      ];
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.post('/api/games/spin-wheel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await gameService.playSpinWheel(userId);
      res.json(result);
    } catch (error) {
      console.error("Error playing spin wheel:", error);
      res.status(400).json({ message: error.message || "Failed to play game" });
    }
  });

  app.post('/api/games/scratch-card', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await gameService.playScratchCard(userId);
      res.json(result);
    } catch (error) {
      console.error("Error playing scratch card:", error);
      res.status(400).json({ message: error.message || "Failed to play game" });
    }
  });

  app.post('/api/games/number-match', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { playerNumbers } = req.body;
      
      if (!playerNumbers || !Array.isArray(playerNumbers) || playerNumbers.length !== 3) {
        return res.status(400).json({ message: "Please select exactly 3 numbers" });
      }

      const result = await gameService.playNumberMatch(userId, playerNumbers);
      res.json(result);
    } catch (error) {
      console.error("Error playing number match:", error);
      res.status(400).json({ message: error.message || "Failed to play game" });
    }
  });

  app.get('/api/games/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserGameHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Failed to fetch game history" });
    }
  });

  app.get('/api/games/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Return basic stats for now
      res.json({ gamesPlayed: 0, totalWins: 0, totalWinnings: "0.00" });
    } catch (error) {
      console.error("Error fetching game stats:", error);
      res.status(500).json({ message: "Failed to fetch game stats" });
    }
  });

  app.get('/api/games/cooldowns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Return empty cooldowns for now
      res.json({});
    } catch (error) {
      console.error("Error fetching cooldowns:", error);
      res.status(500).json({ message: "Failed to fetch cooldowns" });
    }
  });


  // Battle Game API
  app.post('/api/games/battle/bet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { betAmount, selectedPlayer } = req.body;
      
      // Validate input
      if (!betAmount || !selectedPlayer || betAmount <= 0) {
        return res.status(400).json({ message: "Invalid bet parameters" });
      }

      // Get user wallet
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const currentBalance = parseFloat(wallet.balance);
      if (currentBalance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct bet amount
      await storage.deductWalletBalance(userId, betAmount.toString());
      
      // Create bet transaction
      await storage.createTransaction({
        walletId: wallet.id,
        type: 'ticket_purchase',
        amount: `-${betAmount}`,
        description: `Battle game bet on player ${selectedPlayer}`,
        status: 'confirmed',
      });

      res.json({
        success: true,
        newBalance: (currentBalance - betAmount).toFixed(4),
        message: "Bet placed successfully"
      });
    } catch (error) {
      console.error("Error placing battle bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  app.get('/api/wallet/details', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.json({
        balance: wallet.balance,
        bonusBalance: wallet.bonusBalance || '0.00'
      });
    } catch (error) {
      console.error("Error fetching wallet details:", error);
      res.status(500).json({ message: "Failed to fetch wallet details" });
    }
  });

  // === NEW GAMES API ROUTES ===

  // SURPRISE DRAW ROUTES
  app.get('/api/surprise-draw/active', async (req, res) => {
    try {
      const activeDraw = await newGamesService.getActiveSurpriseDraw();
      res.json(activeDraw);
    } catch (error) {
      console.error("Error fetching active surprise draw:", error);
      res.status(500).json({ message: "Failed to fetch surprise draw" });
    }
  });

  app.post('/api/surprise-draw/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { drawId } = req.body;
      
      await newGamesService.purchaseSurpriseDrawTicket(drawId, userId);
      res.json({ success: true, message: "Ticket purchased successfully" });
    } catch (error) {
      console.error("Error purchasing surprise draw ticket:", error);
      res.status(500).json({ message: error.message || "Failed to purchase ticket" });
    }
  });

  // Admin only - Create surprise draw
  app.post('/api/admin/surprise-draw/create', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const drawData = insertSurpriseDrawSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub
      });
      
      const newDraw = await newGamesService.createSurpriseDraw(drawData);
      res.json(newDraw);
    } catch (error) {
      console.error("Error creating surprise draw:", error);
      res.status(500).json({ message: "Failed to create surprise draw" });
    }
  });

  // Admin only - Execute surprise draw
  app.post('/api/admin/surprise-draw/execute', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { drawId } = req.body;
      await newGamesService.executeSurpriseDraw(drawId);
      res.json({ success: true, message: "Surprise draw executed successfully" });
    } catch (error) {
      console.error("Error executing surprise draw:", error);
      res.status(500).json({ message: error.message || "Failed to execute draw" });
    }
  });

  // MYSTERY SEARCH GAME ROUTES
  app.get('/api/mystery-search/current', async (req, res) => {
    try {
      const currentRound = await newGamesService.getCurrentMysterySearchRound();
      res.json(currentRound);
    } catch (error) {
      console.error("Error fetching current mystery search round:", error);
      res.status(500).json({ message: "Failed to fetch current round" });
    }
  });

  app.post('/api/mystery-search/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await newGamesService.registerForMysterySearch(userId);
      res.json({ success: true, message: "Successfully registered for mystery search" });
    } catch (error) {
      console.error("Error registering for mystery search:", error);
      res.status(500).json({ message: error.message || "Failed to register" });
    }
  });

  app.post('/api/mystery-search/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { roundId, submission } = req.body;
      
      const result = await newGamesService.submitMysterySearchGuess(roundId, userId, submission);
      res.json(result);
    } catch (error) {
      console.error("Error submitting mystery search guess:", error);
      res.status(500).json({ message: error.message || "Failed to submit guess" });
    }
  });

  // TRY YOUR LUCK GAME ROUTES
  app.get('/api/try-your-luck/current', async (req, res) => {
    try {
      const currentRound = await newGamesService.getCurrentTryYourLuckRound();
      res.json(currentRound);
    } catch (error) {
      console.error("Error fetching current try your luck round:", error);
      res.status(500).json({ message: "Failed to fetch current round" });
    }
  });

  app.post('/api/try-your-luck/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lockType } = req.body; // 'standard' or 'until_win'
      
      if (!['standard', 'until_win'].includes(lockType)) {
        return res.status(400).json({ message: "Invalid lock type" });
      }
      
      await newGamesService.joinTryYourLuck(userId, lockType);
      res.json({ success: true, message: "Successfully joined Try Your Luck game" });
    } catch (error) {
      console.error("Error joining try your luck:", error);
      res.status(500).json({ message: error.message || "Failed to join game" });
    }
  });

  app.post('/api/try-your-luck/request-unlock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await newGamesService.requestUnlock(userId);
      res.json({ success: true, message: "Unlock requested successfully" });
    } catch (error) {
      console.error("Error requesting unlock:", error);
      res.status(500).json({ message: error.message || "Failed to request unlock" });
    }
  });

  // ADMIN GAME MANAGEMENT ROUTES
  app.post('/api/admin/mystery-search/create-round', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const newRound = await newGamesService.createMysterySearchRound();
      res.json(newRound);
    } catch (error) {
      console.error("Error creating mystery search round:", error);
      res.status(500).json({ message: "Failed to create round" });
    }
  });

  app.post('/api/admin/try-your-luck/create-round', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const newRound = await newGamesService.createTryYourLuckRound();
      res.json(newRound);
    } catch (error) {
      console.error("Error creating try your luck round:", error);
      res.status(500).json({ message: "Failed to create round" });
    }
  });

  app.post('/api/admin/game/force-reveal-clue', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { roundId } = req.body;
      await gameScheduler.forceRevealClue(roundId);
      res.json({ success: true, message: "Clue revealed successfully" });
    } catch (error) {
      console.error("Error forcing clue reveal:", error);
      res.status(500).json({ message: "Failed to reveal clue" });
    }
  });

  app.post('/api/admin/game/force-complete', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { roundId, gameType } = req.body; // 'mystery' or 'try_your_luck'
      await gameScheduler.forceCompleteRound(roundId, gameType);
      res.json({ success: true, message: "Round completed successfully" });
    } catch (error) {
      console.error("Error forcing round completion:", error);
      res.status(500).json({ message: "Failed to complete round" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize schedulers
  initializeDrawScheduler();
  gameScheduler.start();
  
  return httpServer;
}
