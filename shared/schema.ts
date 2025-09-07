import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  decimal,
  boolean,
  text,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet table for managing user credits
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  bonusBalance: decimal("bonus_balance", { precision: 10, scale: 2 }).default("0.00"),
  totalDeposits: decimal("total_deposits", { precision: 10, scale: 2 }).default("0.00"),
  totalWithdrawals: decimal("total_withdrawals", { precision: 10, scale: 2 }).default("0.00"),
  totalWinnings: decimal("total_winnings", { precision: 10, scale: 2 }).default("0.00"),
  totalBonuses: decimal("total_bonuses", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lottery types table
export const lotteries = pgTable("lotteries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Daily", "Weekly", "Monthly"
  type: varchar("type").notNull(), // "daily", "weekly", "monthly"
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }).notNull(),
  prizePool: decimal("prize_pool", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual draw instances
export const draws = pgTable("draws", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lotteryId: varchar("lottery_id").references(() => lotteries.id).notNull(),
  drawDate: timestamp("draw_date").notNull(),
  winningNumbers: integer("winning_numbers").array(),
  status: varchar("status").notNull().default("scheduled"), // "scheduled", "active", "completed", "cancelled"
  totalPrizePool: decimal("total_prize_pool", { precision: 15, scale: 2 }).default("0.00"),
  platformFees: decimal("platform_fees", { precision: 15, scale: 2 }).default("0.00"), // 30%
  distributionPool: decimal("distribution_pool", { precision: 15, scale: 2 }).default("0.00"), // 70%
  ticketsSold: integer("tickets_sold").default(0),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  drawId: varchar("draw_id").references(() => draws.id).notNull(),
  numbers: integer("numbers").array().notNull(),
  ticketNumber: integer("ticket_number").notNull(), // Changed to integer for fair distribution
  isWinner: boolean("is_winner").default(false),
  prizeAmount: decimal("prize_amount", { precision: 10, scale: 2 }).default("0.00"),
  isFreeTicket: boolean("is_free_ticket").default(false), // For monthly bonus tickets
  purchaseDate: timestamp("purchase_date").defaultNow(),
});

// Draw winners tracking table
export const drawWinners = pgTable("draw_winners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drawId: varchar("draw_id").references(() => draws.id).notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id), // Made nullable for fake winners
  userId: varchar("user_id").references(() => users.id).notNull(),
  winnerType: varchar("winner_type").notNull(), // "regular", "special_cash", "motorcycle", "iphone", "mystery_box"
  prizeAmount: decimal("prize_amount", { precision: 15, scale: 2 }).default("0.00"),
  prizeDescription: text("prize_description"), // "R15 Motorcycle", "iPhone 15", "Mystery Gift Box"
  isDistributed: boolean("is_distributed").default(false),
  distributedAt: timestamp("distributed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly ticket bonus tracking
export const monthlyTicketBonuses = pgTable("monthly_ticket_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  dailyTicketsPurchased: integer("daily_tickets_purchased").notNull(),
  bonusTicketsAwarded: integer("bonus_tickets_awarded").default(0),
  nextMonthlyDrawId: varchar("next_monthly_draw_id").references(() => draws.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id).notNull(),
  type: varchar("type").notNull(), // "deposit", "withdrawal", "ticket_purchase", "prize_win", "crypto_deposit", "bonus", "trading_win", "trading_loss"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  cryptoNetwork: varchar("crypto_network"), // "ethereum", "bsc", "polygon"
  cryptoTxHash: varchar("crypto_tx_hash"),
  cryptoAddress: varchar("crypto_address"),
  status: varchar("status").default("pending"), // "pending", "confirmed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
});

// Crypto deposit addresses for users
export const cryptoAddresses = pgTable("crypto_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  network: varchar("network").notNull(), // "ethereum", "bsc", "polygon"
  address: varchar("address").notNull(),
  qrCode: text("qr_code"), // Base64 encoded QR code
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawal requests table
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method").notNull(), // "bank_transfer", "paypal", "crypto"
  recipientDetails: text("recipient_details").notNull(), // JSON string with recipient info
  status: varchar("status").notNull().default("pending"), // "pending", "approved", "rejected", "completed"
  adminNotes: text("admin_notes"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading instruments (BTC/USD, ETH/USD, EUR/USD)
export const tradingInstruments = pgTable("trading_instruments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull().unique(), // "BTCUSD", "ETHUSD", "EURUSD"
  name: varchar("name").notNull(), // "Bitcoin/USD", "Ethereum/USD", "Euro/USD"
  type: varchar("type").notNull(), // "crypto", "forex"
  isActive: boolean("is_active").default(true),
  minTradeAmount: decimal("min_trade_amount", { precision: 10, scale: 2 }).default("1.00"),
  maxTradeAmount: decimal("max_trade_amount", { precision: 10, scale: 2 }).default("1000.00"),
  payoutMultiplier: decimal("payout_multiplier", { precision: 3, scale: 2 }).default("1.95"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trading pots for accounting
export const tradingPots = pgTable("trading_pots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // "pot1", "pot2"
  description: varchar("description"), // "Payout Pool", "Platform Fee"
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Binary trades
export const binaryTrades = pgTable("binary_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  instrumentId: varchar("instrument_id").references(() => tradingInstruments.id).notNull(),
  direction: varchar("direction").notNull(), // "up", "down"
  stakeAmount: decimal("stake_amount", { precision: 10, scale: 2 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 15, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 15, scale: 8 }),
  duration: integer("duration").notNull(), // in seconds
  entryTime: timestamp("entry_time").notNull(),
  expiryTime: timestamp("expiry_time").notNull(),
  status: varchar("status").notNull().default("active"), // "active", "won", "lost"
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Price history for instruments
export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instrumentId: varchar("instrument_id").references(() => tradingInstruments.id).notNull(),
  price: decimal("price", { precision: 15, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  source: varchar("source"), // "coingecko", "binance", "frankfurter"
});

// Trade audit log
export const tradeAuditLog = pgTable("trade_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tradeId: varchar("trade_id").references(() => binaryTrades.id).notNull(),
  action: varchar("action").notNull(), // "created", "settled", "payout"
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Game Zone tables
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // "spin_wheel", "scratch_card", "number_match"
  displayName: varchar("display_name").notNull(), // "Spin Wheel", "Scratch Card", "Number Match"
  description: text("description"),
  icon: varchar("icon").default("🎮"), // emoji icon
  isActive: boolean("is_active").default(true),
  cooldownMinutes: integer("cooldown_minutes").default(60), // minutes between plays
  minReward: decimal("min_reward", { precision: 10, scale: 2 }).default("0.00"),
  maxReward: decimal("max_reward", { precision: 10, scale: 2 }).default("100.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameHistory = pgTable("game_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  outcome: varchar("outcome").notNull(), // "win", "lose"
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).default("0.00"),
  gameData: jsonb("game_data"), // stores game-specific data like winning numbers, etc.
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userGameCooldowns = pgTable("user_game_cooldowns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  lastPlayedAt: timestamp("last_played_at").notNull(),
  nextPlayAvailableAt: timestamp("next_play_available_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game pot system - pot1 for company fees, pot2 for winnings
export const gamePots = pgTable("game_pots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  pot1Balance: decimal("pot1_balance", { precision: 15, scale: 2 }).default("0.00"), // Company fees (30%)
  pot2Balance: decimal("pot2_balance", { precision: 15, scale: 2 }).default("1000.00"), // Prize pool (70%)
  totalBetsToday: decimal("total_bets_today", { precision: 15, scale: 2 }).default("0.00"),
  lastResetDate: date("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced game history with betting amounts
export const gameBets = pgTable("game_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  outcome: varchar("outcome").notNull(), // "win", "lose"
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }).default("0.00"),
  gameData: jsonb("game_data"), // stores game-specific data
  pot1Contribution: decimal("pot1_contribution", { precision: 10, scale: 2 }).default("0.00"), // 30%
  pot2Contribution: decimal("pot2_contribution", { precision: 10, scale: 2 }).default("0.00"), // 70%
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily battle game players
export const battlePlayers = pgTable("battle_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  imageUrl: varchar("image_url").notNull(),
  position: varchar("position"), // "Forward", "Midfielder", etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily battle matchups
export const battleMatchups = pgTable("battle_matchups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  player1Id: varchar("player1_id").references(() => battlePlayers.id).notNull(),
  player2Id: varchar("player2_id").references(() => battlePlayers.id).notNull(),
  battleDate: date("battle_date").notNull(),
  player1TotalBets: decimal("player1_total_bets", { precision: 15, scale: 2 }).default("0.00"),
  player2TotalBets: decimal("player2_total_bets", { precision: 15, scale: 2 }).default("0.00"),
  winnerId: varchar("winner_id").references(() => battlePlayers.id),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Battle bets by users
export const battleBets = pgTable("battle_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  matchupId: varchar("matchup_id").references(() => battleMatchups.id).notNull(),
  selectedPlayerId: varchar("selected_player_id").references(() => battlePlayers.id).notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  outcome: varchar("outcome"), // "win", "lose", "pending"
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Surprise Draws - Admin controlled special draws
export const surpriseDraws = pgTable("surprise_draws", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  prizePool: decimal("prize_pool", { precision: 15, scale: 2 }).notNull(),
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }).notNull(),
  numberOfWinners: integer("number_of_winners").notNull(),
  rewardType: varchar("reward_type").notNull(), // "cash", "gift", "custom"
  customRewardText: text("custom_reward_text"),
  status: varchar("status").notNull().default("scheduled"), // "scheduled", "active", "completed", "cancelled"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  executedAt: timestamp("executed_at"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Surprise Draw Tickets
export const surpriseDrawTickets = pgTable("surprise_draw_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surpriseDrawId: varchar("surprise_draw_id").references(() => surpriseDraws.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ticketNumber: integer("ticket_number").notNull(),
  isWinner: boolean("is_winner").default(false),
  prizeAmount: decimal("prize_amount", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mystery Search Game Rounds
export const mysterySearchRounds = pgTable("mystery_search_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seedPhrase: text("seed_phrase").notNull(), // Encrypted full seed phrase
  revealedWords: jsonb("revealed_words").default('{}'), // Word positions and values
  registrationFee: decimal("registration_fee", { precision: 10, scale: 2 }).default("1.00"),
  prizePool: decimal("prize_pool", { precision: 15, scale: 2 }).default("0.00"),
  status: varchar("status").notNull().default("registration"), // "registration", "active", "completed"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  winnerId: varchar("winner_id").references(() => users.id),
  winnerSubmission: text("winner_submission"),
  wonAt: timestamp("won_at"),
  nextClueRevealAt: timestamp("next_clue_reveal_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mystery Search Game Registrations
export const mysterySearchRegistrations = pgTable("mystery_search_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").references(() => mysterySearchRounds.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  registeredAt: timestamp("registered_at").defaultNow(),
});

// Mystery Search Game Submissions
export const mysterySearchSubmissions = pgTable("mystery_search_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").references(() => mysterySearchRounds.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  submission: text("submission").notNull(),
  isCorrect: boolean("is_correct").default(false),
  cooldownUntil: timestamp("cooldown_until"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Try Your Luck Game Rounds
export const tryYourLuckRounds = pgTable("try_your_luck_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lockAmount: decimal("lock_amount", { precision: 10, scale: 2 }).default("1.00"),
  prizePool: decimal("prize_pool", { precision: 15, scale: 2 }).default("0.00"),
  numberOfWinners: integer("number_of_winners").default(1),
  status: varchar("status").notNull().default("active"), // "active", "completed"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  winnerId: varchar("winner_id").references(() => users.id),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Try Your Luck Game Participants
export const tryYourLuckParticipants = pgTable("try_your_luck_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").references(() => tryYourLuckRounds.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  lockType: varchar("lock_type").notNull(), // "standard", "until_win"
  lockedAmount: decimal("locked_amount", { precision: 10, scale: 2 }).notNull(),
  isWinner: boolean("is_winner").default(false),
  prizeAmount: decimal("prize_amount", { precision: 10, scale: 2 }).default("0.00"),
  unlockRequested: boolean("unlock_requested").default(false),
  unlockedAt: timestamp("unlocked_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  tickets: many(tickets),
  wonDraws: many(draws),
  cryptoAddresses: many(cryptoAddresses),
  withdrawalRequests: many(withdrawalRequests),
  binaryTrades: many(binaryTrades),
  gameHistory: many(gameHistory),
  gameCooldowns: many(userGameCooldowns),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const lotteriesRelations = relations(lotteries, ({ many }) => ({
  draws: many(draws),
}));

export const drawsRelations = relations(draws, ({ one, many }) => ({
  lottery: one(lotteries, {
    fields: [draws.lotteryId],
    references: [lotteries.id],
  }),
  tickets: many(tickets),
  winners: many(drawWinners),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  draw: one(draws, {
    fields: [tickets.drawId],
    references: [draws.id],
  }),
  winner: one(drawWinners, {
    fields: [tickets.id],
    references: [drawWinners.ticketId],
  }),
}));

export const drawWinnersRelations = relations(drawWinners, ({ one }) => ({
  draw: one(draws, {
    fields: [drawWinners.drawId],
    references: [draws.id],
  }),
  ticket: one(tickets, {
    fields: [drawWinners.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [drawWinners.userId],
    references: [users.id],
  }),
}));

export const monthlyTicketBonusesRelations = relations(monthlyTicketBonuses, ({ one }) => ({
  user: one(users, {
    fields: [monthlyTicketBonuses.userId],
    references: [users.id],
  }),
  nextMonthlyDraw: one(draws, {
    fields: [monthlyTicketBonuses.nextMonthlyDrawId],
    references: [draws.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

export const cryptoAddressesRelations = relations(cryptoAddresses, ({ one }) => ({
  user: one(users, {
    fields: [cryptoAddresses.userId],
    references: [users.id],
  }),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [withdrawalRequests.approvedBy],
    references: [users.id],
  }),
  rejector: one(users, {
    fields: [withdrawalRequests.rejectedBy],
    references: [users.id],
  }),
}));

export const tradingInstrumentsRelations = relations(tradingInstruments, ({ many }) => ({
  trades: many(binaryTrades),
  priceHistory: many(priceHistory),
}));

export const binaryTradesRelations = relations(binaryTrades, ({ one, many }) => ({
  user: one(users, {
    fields: [binaryTrades.userId],
    references: [users.id],
  }),
  instrument: one(tradingInstruments, {
    fields: [binaryTrades.instrumentId],
    references: [tradingInstruments.id],
  }),
  auditLogs: many(tradeAuditLog),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  instrument: one(tradingInstruments, {
    fields: [priceHistory.instrumentId],
    references: [tradingInstruments.id],
  }),
}));

export const tradeAuditLogRelations = relations(tradeAuditLog, ({ one }) => ({
  trade: one(binaryTrades, {
    fields: [tradeAuditLog.tradeId],
    references: [binaryTrades.id],
  }),
}));

// Game Zone relations
export const gamesRelations = relations(games, ({ many }) => ({
  gameHistory: many(gameHistory),
  userCooldowns: many(userGameCooldowns),
}));

export const gameHistoryRelations = relations(gameHistory, ({ one }) => ({
  user: one(users, {
    fields: [gameHistory.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [gameHistory.gameId],
    references: [games.id],
  }),
}));

export const userGameCooldownsRelations = relations(userGameCooldowns, ({ one }) => ({
  user: one(users, {
    fields: [userGameCooldowns.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [userGameCooldowns.gameId],
    references: [games.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const upsertUserSchema = insertUserSchema.pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  isAdmin: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLotterySchema = createInsertSchema(lotteries).omit({ id: true, createdAt: true });
export const insertDrawSchema = createInsertSchema(draws).omit({ id: true, createdAt: true, executedAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, purchaseDate: true });
export const insertDrawWinnerSchema = createInsertSchema(drawWinners).omit({ id: true, createdAt: true, distributedAt: true });
export const insertMonthlyTicketBonusSchema = createInsertSchema(monthlyTicketBonuses).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertCryptoAddressSchema = createInsertSchema(cryptoAddresses).omit({ id: true, createdAt: true });
export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({ 
  id: true, 
  userId: true,
  status: true,
  createdAt: true, 
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  completedAt: true
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Lottery = typeof lotteries.$inferSelect;
export type InsertLottery = z.infer<typeof insertLotterySchema>;
export type Draw = typeof draws.$inferSelect;
export type InsertDraw = z.infer<typeof insertDrawSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type DrawWinner = typeof drawWinners.$inferSelect;
export type InsertDrawWinner = z.infer<typeof insertDrawWinnerSchema>;
export type MonthlyTicketBonus = typeof monthlyTicketBonuses.$inferSelect;
export type InsertMonthlyTicketBonus = z.infer<typeof insertMonthlyTicketBonusSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type CryptoAddress = typeof cryptoAddresses.$inferSelect;
export type InsertCryptoAddress = z.infer<typeof insertCryptoAddressSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

// Trading schemas
export const insertTradingInstrumentSchema = createInsertSchema(tradingInstruments).omit({ id: true, createdAt: true });
export const insertTradingPotSchema = createInsertSchema(tradingPots).omit({ id: true, updatedAt: true });
export const insertBinaryTradeSchema = createInsertSchema(binaryTrades).omit({ 
  id: true, 
  createdAt: true,
  settledAt: true,
  exitPrice: true,
  payoutAmount: true
});
export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({ id: true });
export const insertTradeAuditLogSchema = createInsertSchema(tradeAuditLog).omit({ id: true, timestamp: true });

// Trading types
export type TradingInstrument = typeof tradingInstruments.$inferSelect;
export type InsertTradingInstrument = z.infer<typeof insertTradingInstrumentSchema>;
export type TradingPot = typeof tradingPots.$inferSelect;
export type InsertTradingPot = z.infer<typeof insertTradingPotSchema>;
export type BinaryTrade = typeof binaryTrades.$inferSelect;
export type InsertBinaryTrade = z.infer<typeof insertBinaryTradeSchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type TradeAuditLog = typeof tradeAuditLog.$inferSelect;
export type InsertTradeAuditLog = z.infer<typeof insertTradeAuditLogSchema>;

// Game Zone schemas
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true });
export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({ id: true, createdAt: true });
export const insertUserGameCooldownSchema = createInsertSchema(userGameCooldowns).omit({ id: true, updatedAt: true });

// Game Zone types
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type UserGameCooldown = typeof userGameCooldowns.$inferSelect;
export type InsertUserGameCooldown = z.infer<typeof insertUserGameCooldownSchema>;

// New features schemas
export const insertSurpriseDrawSchema = createInsertSchema(surpriseDraws).omit({ id: true, createdAt: true, executedAt: true });
export const insertSurpriseDrawTicketSchema = createInsertSchema(surpriseDrawTickets).omit({ id: true, createdAt: true });
export const insertMysterySearchRoundSchema = createInsertSchema(mysterySearchRounds).omit({ id: true, createdAt: true });
export const insertMysterySearchRegistrationSchema = createInsertSchema(mysterySearchRegistrations).omit({ id: true, registeredAt: true });
export const insertMysterySearchSubmissionSchema = createInsertSchema(mysterySearchSubmissions).omit({ id: true, submittedAt: true });
export const insertTryYourLuckRoundSchema = createInsertSchema(tryYourLuckRounds).omit({ id: true, createdAt: true, executedAt: true });
export const insertTryYourLuckParticipantSchema = createInsertSchema(tryYourLuckParticipants).omit({ id: true, joinedAt: true, unlockedAt: true });

// New features types
export type SurpriseDraw = typeof surpriseDraws.$inferSelect;
export type InsertSurpriseDraw = z.infer<typeof insertSurpriseDrawSchema>;
export type SurpriseDrawTicket = typeof surpriseDrawTickets.$inferSelect;
export type InsertSurpriseDrawTicket = z.infer<typeof insertSurpriseDrawTicketSchema>;
export type MysterySearchRound = typeof mysterySearchRounds.$inferSelect;
export type InsertMysterySearchRound = z.infer<typeof insertMysterySearchRoundSchema>;
export type MysterySearchRegistration = typeof mysterySearchRegistrations.$inferSelect;
export type InsertMysterySearchRegistration = z.infer<typeof insertMysterySearchRegistrationSchema>;
export type MysterySearchSubmission = typeof mysterySearchSubmissions.$inferSelect;
export type InsertMysterySearchSubmission = z.infer<typeof insertMysterySearchSubmissionSchema>;
export type TryYourLuckRound = typeof tryYourLuckRounds.$inferSelect;
export type InsertTryYourLuckRound = z.infer<typeof insertTryYourLuckRoundSchema>;
export type TryYourLuckParticipant = typeof tryYourLuckParticipants.$inferSelect;
export type InsertTryYourLuckParticipant = z.infer<typeof insertTryYourLuckParticipantSchema>;
