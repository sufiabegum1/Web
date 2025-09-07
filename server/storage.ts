import {
  users,
  wallets,
  lotteries,
  draws,
  tickets,
  drawWinners,
  transactions,
  cryptoAddresses,
  withdrawalRequests,
  tradingInstruments,
  tradingPots,
  binaryTrades,
  priceHistory,
  tradeAuditLog,
  games,
  gameHistory,
  userGameCooldowns,
  type User,
  type UpsertUser,
  type Wallet,
  type InsertWallet,
  type Lottery,
  type InsertLottery,
  type Draw,
  type InsertDraw,
  type Ticket,
  type InsertTicket,
  type Transaction,
  type InsertTransaction,
  type CryptoAddress,
  type InsertCryptoAddress,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type TradingInstrument,
  type InsertTradingInstrument,
  type TradingPot,
  type InsertTradingPot,
  type BinaryTrade,
  type InsertBinaryTrade,
  type PriceHistory,
  type InsertPriceHistory,
  type TradeAuditLog,
  type InsertTradeAuditLog,
  type Game,
  type InsertGame,
  type GameHistory,
  type InsertGameHistory,
  type UserGameCooldown,
  type InsertUserGameCooldown,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Wallet operations
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, amount: string): Promise<void>;
  
  // Lottery operations
  getLotteries(): Promise<Lottery[]>;
  getLottery(id: string): Promise<Lottery | undefined>;
  createLottery(lottery: InsertLottery): Promise<Lottery>;
  
  // Draw operations
  getActiveDraws(): Promise<(Draw & { lottery: Lottery })[]>;
  getUpcomingDraws(): Promise<(Draw & { lottery: Lottery })[]>;
  getCompletedDraws(): Promise<(Draw & { lottery: Lottery; winner?: User })[]>;
  getDraw(id: string): Promise<Draw | undefined>;
  createDraw(draw: InsertDraw): Promise<Draw>;
  updateDraw(id: string, updates: Partial<Draw>): Promise<void>;
  getDrawsForLottery(lotteryId: string): Promise<Draw[]>;
  
  // Ticket operations
  getUserTickets(userId: string): Promise<(Ticket & { draw: Draw & { lottery: Lottery } })[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicketsForDraw(drawId: string): Promise<(Ticket & { user: User })[]>;
  updateTicketWinningStatus(ticketId: string, isWinner: boolean, prizeAmount: string): Promise<void>;
  getUserDailyTicketCount(userId: string, date: Date): Promise<number>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getWalletTransactions(walletId: string): Promise<Transaction[]>;
  
  // Crypto operations
  getCryptoAddress(userId: string, network: string): Promise<CryptoAddress | undefined>;
  createCryptoAddress(address: InsertCryptoAddress): Promise<CryptoAddress>;
  getUserCryptoAddresses(userId: string): Promise<CryptoAddress[]>;
  updateTransactionStatus(id: string, status: string): Promise<void>;
  
  // Withdrawal operations
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]>;
  getAllWithdrawalRequests(): Promise<(WithdrawalRequest & { user: User })[]>;
  updateWithdrawalRequest(id: string, updates: Partial<WithdrawalRequest>): Promise<void>;
  approveWithdrawalRequest(id: string, adminId: string, notes?: string): Promise<void>;
  rejectWithdrawalRequest(id: string, adminId: string, notes?: string): Promise<void>;
  completeWithdrawalRequest(id: string): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalTickets: number;
    totalRevenue: string;
    totalWinners: number;
  }>;

  // Trading operations
  getTradingInstruments(): Promise<TradingInstrument[]>;
  getTradingInstrument(id: string): Promise<TradingInstrument | undefined>;
  getTradingInstrumentBySymbol(symbol: string): Promise<TradingInstrument | undefined>;
  createTradingInstrument(instrument: InsertTradingInstrument): Promise<TradingInstrument>;
  
  // Trading pot operations
  getTradingPots(): Promise<TradingPot[]>;
  getTradingPot(name: string): Promise<TradingPot | undefined>;
  updateTradingPotBalance(name: string, amount: string): Promise<void>;
  
  // Binary trade operations
  createBinaryTrade(trade: InsertBinaryTrade): Promise<BinaryTrade>;
  getBinaryTrade(id: string): Promise<BinaryTrade | undefined>;
  getUserBinaryTrades(userId: string): Promise<(BinaryTrade & { instrument: TradingInstrument })[]>;
  getActiveBinaryTrades(): Promise<(BinaryTrade & { instrument: TradingInstrument; user: User })[]>;
  updateBinaryTrade(id: string, updates: Partial<BinaryTrade>): Promise<void>;
  settleBinaryTrade(id: string, exitPrice: string, status: 'won' | 'lost', payoutAmount?: string): Promise<void>;
  
  // Price history operations
  savePriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(symbol: string, timestamp: Date): Promise<PriceHistory | undefined>;
  getLatestPrice(symbol: string): Promise<PriceHistory | undefined>;
  
  // Trade audit operations
  addTradeAuditLog(log: InsertTradeAuditLog): Promise<TradeAuditLog>;
  getTradeAuditLogs(tradeId: string): Promise<TradeAuditLog[]>;

  // Game Zone operations
  getGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  getGameByName(name: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<void>;
  
  // Game history operations
  createGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  getUserGameHistory(userId: string, limit?: number): Promise<GameHistory[]>;
  getGameHistory(gameId: string, limit?: number): Promise<(GameHistory & { user: User })[]>;
  
  // Game cooldown operations
  getUserGameCooldown(userId: string, gameId: string): Promise<UserGameCooldown | undefined>;
  upsertUserGameCooldown(cooldown: InsertUserGameCooldown): Promise<UserGameCooldown>;
  
  // Wallet bonus operations
  addBonusToWallet(userId: string, amount: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Create wallet for new user
    const existingWallet = await this.getWallet(user.id);
    if (!existingWallet) {
      await this.createWallet({ userId: user.id });
    }
    
    return user;
  }

  // Wallet operations
  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(userId: string, amount: string): Promise<void> {
    await db
      .update(wallets)
      .set({ 
        balance: sql`${wallets.balance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId));
  }

  async deductWalletBalance(userId: string, amount: string): Promise<void> {
    await db
      .update(wallets)
      .set({ 
        balance: sql`${wallets.balance} - ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId));
  }

  async updateWalletStats(userId: string, type: 'deposit' | 'withdrawal' | 'winnings' | 'bonus', amount: string): Promise<void> {
    const updates: Record<string, any> = { updatedAt: new Date() };
    
    switch (type) {
      case 'deposit':
        updates.totalDeposits = sql`${wallets.totalDeposits} + ${amount}`;
        break;
      case 'withdrawal':
        updates.totalWithdrawals = sql`${wallets.totalWithdrawals} + ${amount}`;
        break;
      case 'winnings':
        updates.totalWinnings = sql`${wallets.totalWinnings} + ${amount}`;
        break;
      case 'bonus':
        updates.totalBonuses = sql`${wallets.totalBonuses} + ${amount}`;
        updates.bonusBalance = sql`${wallets.bonusBalance} + ${amount}`;
        break;
    }

    await db
      .update(wallets)
      .set(updates)
      .where(eq(wallets.userId, userId));
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    // Get user's wallet first
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      return [];
    }
    
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.walletId, wallet.id))
      .orderBy(desc(transactions.createdAt));
  }

  // Lottery operations
  async getLotteries(): Promise<Lottery[]> {
    return await db.select().from(lotteries).where(eq(lotteries.isActive, true));
  }

  async getLottery(id: string): Promise<Lottery | undefined> {
    const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, id));
    return lottery;
  }

  async createLottery(lottery: InsertLottery): Promise<Lottery> {
    const [newLottery] = await db.insert(lotteries).values(lottery).returning();
    return newLottery;
  }

  // Draw operations
  async getActiveDraws(): Promise<(Draw & { lottery: Lottery })[]> {
    return await db
      .select()
      .from(draws)
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(and(
        eq(draws.status, "active"),
        gte(draws.drawDate, new Date())
      ))
      .then(results => results.map(result => ({ ...result.draws, lottery: result.lotteries })));
  }

  async getUpcomingDraws(): Promise<(Draw & { lottery: Lottery })[]> {
    return await db
      .select()
      .from(draws)
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(and(
        eq(draws.status, "scheduled"),
        gte(draws.drawDate, new Date())
      ))
      .orderBy(draws.drawDate)
      .then(results => results.map(result => ({ ...result.draws, lottery: result.lotteries })));
  }

  async getScheduledDraws(): Promise<(Draw & { lottery: Lottery })[]> {
    return await db
      .select()
      .from(draws)
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(eq(draws.status, "scheduled"))
      .orderBy(draws.drawDate)
      .then(results => results.map(result => ({ ...result.draws, lottery: result.lotteries })));
  }

  async getCompletedDraws(): Promise<(Draw & { lottery: Lottery; winner?: User })[]> {
    // Get completed draws grouped by lottery type with history limits
    // Daily: last 15 draws, Weekly: last 5 draws, Monthly: last 3 draws
    const dailyDraws = await db
      .select()
      .from(draws)
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(and(
        eq(draws.status, "completed"),
        eq(lotteries.type, "daily")
      ))
      .orderBy(desc(draws.drawDate))
      .limit(15);

    const weeklyDraws = await db
      .select()
      .from(draws)
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(and(
        eq(draws.status, "completed"),
        eq(lotteries.type, "weekly")
      ))
      .orderBy(desc(draws.drawDate))
      .limit(5);

    const monthlyDraws = await db
      .select()
      .from(draws)
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(and(
        eq(draws.status, "completed"),
        eq(lotteries.type, "monthly")
      ))
      .orderBy(desc(draws.drawDate))
      .limit(3);

    // Combine all draws and sort by date
    const allCompletedDraws = [...dailyDraws, ...weeklyDraws, ...monthlyDraws]
      .sort((a, b) => new Date(b.draws.drawDate).getTime() - new Date(a.draws.drawDate).getTime());

    // For each draw, get the first winner
    const drawsWithWinners = await Promise.all(
      allCompletedDraws.map(async (result) => {
        const [firstWinner] = await db
          .select()
          .from(drawWinners)
          .innerJoin(users, eq(drawWinners.userId, users.id))
          .where(eq(drawWinners.drawId, result.draws.id))
          .limit(1);

        return {
          ...result.draws,
          lottery: result.lotteries,
          winner: firstWinner?.users || undefined
        };
      })
    );

    return drawsWithWinners;
  }

  async getDraw(id: string): Promise<Draw | undefined> {
    const [draw] = await db.select().from(draws).where(eq(draws.id, id));
    return draw;
  }

  async createDraw(draw: InsertDraw): Promise<Draw> {
    const [newDraw] = await db.insert(draws).values(draw).returning();
    return newDraw;
  }

  async updateDraw(id: string, updates: Partial<Draw>): Promise<void> {
    await db
      .update(draws)
      .set(updates)
      .where(eq(draws.id, id));
  }

  async getDrawsForLottery(lotteryId: string): Promise<Draw[]> {
    return await db
      .select()
      .from(draws)
      .where(eq(draws.lotteryId, lotteryId))
      .orderBy(desc(draws.drawDate));
  }

  // Ticket operations
  async getUserTickets(userId: string): Promise<(Ticket & { draw: Draw & { lottery: Lottery } })[]> {
    return await db
      .select()
      .from(tickets)
      .innerJoin(draws, eq(tickets.drawId, draws.id))
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.purchaseDate))
      .then(results => results.map(result => ({ 
        ...result.tickets, 
        draw: { ...result.draws, lottery: result.lotteries }
      })));
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    
    // Update tickets sold count for the draw
    await db
      .update(draws)
      .set({ 
        ticketsSold: sql`${draws.ticketsSold} + 1`
      })
      .where(eq(draws.id, ticket.drawId));
    
    return newTicket;
  }

  async getTicketsForDraw(drawId: string): Promise<(Ticket & { user: User })[]> {
    return await db
      .select()
      .from(tickets)
      .innerJoin(users, eq(tickets.userId, users.id))
      .where(eq(tickets.drawId, drawId))
      .then(results => results.map(result => ({ 
        ...result.tickets, 
        user: result.users
      })));
  }

  async updateTicketWinningStatus(ticketId: string, isWinner: boolean, prizeAmount: string): Promise<void> {
    await db
      .update(tickets)
      .set({ isWinner, prizeAmount })
      .where(eq(tickets.id, ticketId));
  }

  async getUserDailyTicketCount(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .innerJoin(draws, eq(tickets.drawId, draws.id))
      .innerJoin(lotteries, eq(draws.lotteryId, lotteries.id))
      .where(
        and(
          eq(tickets.userId, userId),
          eq(lotteries.type, 'daily'),
          gte(tickets.purchaseDate, startOfDay),
          lte(tickets.purchaseDate, endOfDay)
        )
      );

    return count[0]?.count || 0;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getWalletTransactions(walletId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.walletId, walletId))
      .orderBy(desc(transactions.createdAt));
  }

  // Crypto operations
  async getCryptoAddress(userId: string, network: string): Promise<CryptoAddress | undefined> {
    const [address] = await db
      .select()
      .from(cryptoAddresses)
      .where(and(eq(cryptoAddresses.userId, userId), eq(cryptoAddresses.network, network)));
    return address;
  }

  async createCryptoAddress(address: InsertCryptoAddress): Promise<CryptoAddress> {
    const [newAddress] = await db.insert(cryptoAddresses).values(address).returning();
    return newAddress;
  }

  async getUserCryptoAddresses(userId: string): Promise<CryptoAddress[]> {
    return await db
      .select()
      .from(cryptoAddresses)
      .where(eq(cryptoAddresses.userId, userId))
      .orderBy(desc(cryptoAddresses.createdAt));
  }

  async updateTransactionStatus(id: string, status: string): Promise<void> {
    await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, id));
  }

  // Withdrawal operations
  async createWithdrawalRequest(request: InsertWithdrawalRequest, userId?: string): Promise<WithdrawalRequest> {
    const requestData = userId ? { ...request, userId, status: "pending" } : request;
    const [withdrawalRequest] = await db
      .insert(withdrawalRequests)
      .values(requestData)
      .returning();
    return withdrawalRequest;
  }

  async getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async getAllWithdrawalRequests(): Promise<(WithdrawalRequest & { user: User })[]> {
    return await db
      .select({
        id: withdrawalRequests.id,
        userId: withdrawalRequests.userId,
        amount: withdrawalRequests.amount,
        method: withdrawalRequests.method,
        recipientDetails: withdrawalRequests.recipientDetails,
        status: withdrawalRequests.status,
        adminNotes: withdrawalRequests.adminNotes,
        approvedBy: withdrawalRequests.approvedBy,
        approvedAt: withdrawalRequests.approvedAt,
        rejectedBy: withdrawalRequests.rejectedBy,
        rejectedAt: withdrawalRequests.rejectedAt,
        completedAt: withdrawalRequests.completedAt,
        createdAt: withdrawalRequests.createdAt,
        updatedAt: withdrawalRequests.updatedAt,
        user: users,
      })
      .from(withdrawalRequests)
      .leftJoin(users, eq(withdrawalRequests.userId, users.id))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async updateWithdrawalRequest(id: string, updates: Partial<WithdrawalRequest>): Promise<void> {
    await db
      .update(withdrawalRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(withdrawalRequests.id, id));
  }

  async approveWithdrawalRequest(id: string, adminId: string, notes?: string): Promise<void> {
    await db
      .update(withdrawalRequests)
      .set({
        status: "approved",
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id));
  }

  async rejectWithdrawalRequest(id: string, adminId: string, notes?: string): Promise<void> {
    await db
      .update(withdrawalRequests)
      .set({
        status: "rejected",
        rejectedBy: adminId,
        rejectedAt: new Date(),
        adminNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id));
  }

  async completeWithdrawalRequest(id: string): Promise<void> {
    await db
      .update(withdrawalRequests)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalTickets: number;
    totalRevenue: string;
    totalWinners: number;
  }> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [ticketCount] = await db.select({ count: sql<number>`count(*)` }).from(tickets);
    const [revenueSum] = await db.select({ sum: sql<string>`sum(${transactions.amount})` }).from(transactions).where(eq(transactions.type, "ticket_purchase"));
    const [winnerCount] = await db.select({ count: sql<number>`count(distinct ${tickets.userId})` }).from(tickets).where(eq(tickets.isWinner, true));

    return {
      totalUsers: userCount.count,
      totalTickets: ticketCount.count,
      totalRevenue: revenueSum.sum || "0",
      totalWinners: winnerCount.count,
    };
  }

  // Trading operations
  async getTradingInstruments(): Promise<TradingInstrument[]> {
    return await db
      .select()
      .from(tradingInstruments)
      .orderBy(tradingInstruments.symbol);
  }

  async getTradingInstrument(id: string): Promise<TradingInstrument | undefined> {
    const [instrument] = await db
      .select()
      .from(tradingInstruments)
      .where(eq(tradingInstruments.id, id));
    return instrument;
  }

  async getTradingInstrumentBySymbol(symbol: string): Promise<TradingInstrument | undefined> {
    const [instrument] = await db
      .select()
      .from(tradingInstruments)
      .where(eq(tradingInstruments.symbol, symbol));
    return instrument;
  }

  async createTradingInstrument(instrument: InsertTradingInstrument): Promise<TradingInstrument> {
    const [newInstrument] = await db
      .insert(tradingInstruments)
      .values(instrument)
      .returning();
    return newInstrument;
  }

  // Trading pot operations
  async getTradingPots(): Promise<TradingPot[]> {
    return await db
      .select()
      .from(tradingPots);
  }

  async getTradingPot(name: string): Promise<TradingPot | undefined> {
    const [pot] = await db
      .select()
      .from(tradingPots)
      .where(eq(tradingPots.name, name));
    return pot;
  }

  async updateTradingPotBalance(name: string, amount: string): Promise<void> {
    await db
      .update(tradingPots)
      .set({
        balance: amount,
        updatedAt: new Date(),
      })
      .where(eq(tradingPots.name, name));
  }

  // Binary trade operations
  async createBinaryTrade(trade: InsertBinaryTrade): Promise<BinaryTrade> {
    const [newTrade] = await db
      .insert(binaryTrades)
      .values(trade)
      .returning();
    return newTrade;
  }

  async getBinaryTrade(id: string): Promise<BinaryTrade | undefined> {
    const [trade] = await db
      .select()
      .from(binaryTrades)
      .where(eq(binaryTrades.id, id));
    return trade;
  }

  async getUserBinaryTrades(userId: string): Promise<(BinaryTrade & { instrument: TradingInstrument })[]> {
    return await db
      .select({
        id: binaryTrades.id,
        userId: binaryTrades.userId,
        instrumentId: binaryTrades.instrumentId,
        direction: binaryTrades.direction,
        stakeAmount: binaryTrades.stakeAmount,
        entryPrice: binaryTrades.entryPrice,
        exitPrice: binaryTrades.exitPrice,
        duration: binaryTrades.duration,
        entryTime: binaryTrades.entryTime,
        expiryTime: binaryTrades.expiryTime,
        status: binaryTrades.status,
        payoutAmount: binaryTrades.payoutAmount,
        settledAt: binaryTrades.settledAt,
        createdAt: binaryTrades.createdAt,
        instrument: {
          id: tradingInstruments.id,
          symbol: tradingInstruments.symbol,
          name: tradingInstruments.name,
          isActive: tradingInstruments.isActive,
          createdAt: tradingInstruments.createdAt,
        },
      })
      .from(binaryTrades)
      .leftJoin(tradingInstruments, eq(binaryTrades.instrumentId, tradingInstruments.id))
      .where(eq(binaryTrades.userId, userId))
      .orderBy(desc(binaryTrades.createdAt));
  }

  async getActiveBinaryTrades(): Promise<(BinaryTrade & { instrument: TradingInstrument; user: User })[]> {
    return await db
      .select({
        id: binaryTrades.id,
        userId: binaryTrades.userId,
        instrumentId: binaryTrades.instrumentId,
        direction: binaryTrades.direction,
        stakeAmount: binaryTrades.stakeAmount,
        entryPrice: binaryTrades.entryPrice,
        exitPrice: binaryTrades.exitPrice,
        duration: binaryTrades.duration,
        entryTime: binaryTrades.entryTime,
        expiryTime: binaryTrades.expiryTime,
        status: binaryTrades.status,
        payoutAmount: binaryTrades.payoutAmount,
        settledAt: binaryTrades.settledAt,
        createdAt: binaryTrades.createdAt,
        instrument: {
          id: tradingInstruments.id,
          symbol: tradingInstruments.symbol,
          name: tradingInstruments.name,
          isActive: tradingInstruments.isActive,
          createdAt: tradingInstruments.createdAt,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(binaryTrades)
      .leftJoin(tradingInstruments, eq(binaryTrades.instrumentId, tradingInstruments.id))
      .leftJoin(users, eq(binaryTrades.userId, users.id))
      .where(eq(binaryTrades.status, 'active'))
      .orderBy(binaryTrades.expiryTime);
  }

  async updateBinaryTrade(id: string, updates: Partial<BinaryTrade>): Promise<void> {
    await db
      .update(binaryTrades)
      .set(updates)
      .where(eq(binaryTrades.id, id));
  }

  async settleBinaryTrade(id: string, exitPrice: string, status: 'won' | 'lost', payoutAmount?: string): Promise<void> {
    await db
      .update(binaryTrades)
      .set({
        exitPrice,
        status,
        payoutAmount,
        settledAt: new Date(),
      })
      .where(eq(binaryTrades.id, id));
  }

  // Price history operations
  async savePriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory> {
    const [newPrice] = await db
      .insert(priceHistory)
      .values(priceData)
      .returning();
    return newPrice;
  }

  async getPriceHistory(symbol: string, timestamp: Date): Promise<PriceHistory | undefined> {
    // Find the closest price entry to the given timestamp
    const instrument = await this.getTradingInstrumentBySymbol(symbol);
    if (!instrument) return undefined;

    const [price] = await db
      .select()
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.instrumentId, instrument.id),
          lte(priceHistory.timestamp, timestamp)
        )
      )
      .orderBy(desc(priceHistory.timestamp))
      .limit(1);
    
    return price;
  }

  async getLatestPrice(symbol: string): Promise<PriceHistory | undefined> {
    const instrument = await this.getTradingInstrumentBySymbol(symbol);
    if (!instrument) return undefined;

    const [price] = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.instrumentId, instrument.id))
      .orderBy(desc(priceHistory.timestamp))
      .limit(1);
    
    return price;
  }

  // Trade audit operations
  async addTradeAuditLog(log: InsertTradeAuditLog): Promise<TradeAuditLog> {
    const [newLog] = await db
      .insert(tradeAuditLog)
      .values(log)
      .returning();
    return newLog;
  }

  async getTradeAuditLogs(tradeId: string): Promise<TradeAuditLog[]> {
    return await db
      .select()
      .from(tradeAuditLog)
      .where(eq(tradeAuditLog.tradeId, tradeId))
      .orderBy(tradeAuditLog.timestamp);
  }

  // Game Zone operations
  async getGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(games.displayName);
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getGameByName(name: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.name, name));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<void> {
    await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id));
  }

  // Game history operations
  async createGameHistory(history: InsertGameHistory): Promise<GameHistory> {
    const [newHistory] = await db.insert(gameHistory).values(history).returning();
    return newHistory;
  }

  async getUserGameHistory(userId: string, limit: number = 10): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId))
      .orderBy(desc(gameHistory.createdAt))
      .limit(limit);
  }

  async getGameHistory(gameId: string, limit: number = 10): Promise<(GameHistory & { user: User })[]> {
    return await db
      .select()
      .from(gameHistory)
      .innerJoin(users, eq(gameHistory.userId, users.id))
      .where(eq(gameHistory.gameId, gameId))
      .orderBy(desc(gameHistory.createdAt))
      .limit(limit);
  }

  // Game cooldown operations
  async getUserGameCooldown(userId: string, gameId: string): Promise<UserGameCooldown | undefined> {
    const [cooldown] = await db
      .select()
      .from(userGameCooldowns)
      .where(
        and(
          eq(userGameCooldowns.userId, userId),
          eq(userGameCooldowns.gameId, gameId)
        )
      );
    return cooldown;
  }

  async upsertUserGameCooldown(cooldown: InsertUserGameCooldown): Promise<UserGameCooldown> {
    const [newCooldown] = await db
      .insert(userGameCooldowns)
      .values(cooldown)
      .onConflictDoUpdate({
        target: [userGameCooldowns.userId, userGameCooldowns.gameId],
        set: {
          lastPlayedAt: cooldown.lastPlayedAt,
          nextPlayAvailableAt: cooldown.nextPlayAvailableAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newCooldown;
  }

  // Wallet bonus operations
  async addBonusToWallet(userId: string, amount: number): Promise<void> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const currentBonusBalance = parseFloat(wallet.bonusBalance || '0');
    const currentTotalBonuses = parseFloat(wallet.totalBonuses || '0');
    const newBonusBalance = (currentBonusBalance + amount).toFixed(2);
    const newTotalBonuses = (currentTotalBonuses + amount).toFixed(2);

    await db
      .update(wallets)
      .set({
        bonusBalance: newBonusBalance,
        totalBonuses: newTotalBonuses,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Create transaction record
    await this.createTransaction({
      walletId: wallet.id,
      type: 'bonus',
      amount: amount.toFixed(2),
      description: `Game Zone bonus reward`,
      status: 'confirmed',
    });
  }
}

export const storage = new DatabaseStorage();
