import { storage } from '../storage';
import crypto from 'crypto';
import type { Game, GameHistory, UserGameCooldown } from '@shared/schema';

export class GameService {
  private static instance: GameService;
  
  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  // Generate secure random number using crypto
  private generateSecureRandom(min: number = 0, max: number = 1): number {
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0) / 0xFFFFFFFF;
    return Math.floor(randomValue * (max - min + 1)) + min;
  }

  // Check if user can play a game (cooldown validation)
  async canUserPlay(userId: string, gameId: string): Promise<{ canPlay: boolean; cooldownEndsAt?: Date }> {
    const cooldown = await storage.getUserGameCooldown(userId, gameId);
    
    if (!cooldown) {
      return { canPlay: true };
    }

    const now = new Date();
    const nextPlayTime = new Date(cooldown.nextPlayAvailableAt);
    
    if (now < nextPlayTime) {
      return { 
        canPlay: false, 
        cooldownEndsAt: nextPlayTime 
      };
    }

    return { canPlay: true };
  }

  // Play Spin Wheel game
  async playSpinWheel(userId: string, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    outcome: 'win' | 'lose';
    rewardAmount: number;
    message: string;
    gameData?: any;
  }> {
    const game = await storage.getGameByName('spin_wheel');
    if (!game || !game.isActive) {
      return { success: false, outcome: 'lose', rewardAmount: 0, message: 'Game not available' };
    }

    // Check cooldown
    const cooldownCheck = await this.canUserPlay(userId, game.id);
    if (!cooldownCheck.canPlay) {
      return { 
        success: false, 
        outcome: 'lose', 
        rewardAmount: 0, 
        message: `Please wait ${Math.ceil((cooldownCheck.cooldownEndsAt!.getTime() - Date.now()) / 60000)} minutes before playing again` 
      };
    }

    // Generate outcome (30% win chance)
    const winChance = 30;
    const randomNumber = this.generateSecureRandom(1, 100);
    const isWin = randomNumber <= winChance;

    let rewardAmount = 0;
    let gameData: any = { spinResult: randomNumber };

    if (isWin) {
      // Generate reward amount between min and max
      const minReward = parseFloat(game.minReward || '0');
      const maxReward = parseFloat(game.maxReward || '100');
      rewardAmount = this.generateSecureRandom(minReward * 100, maxReward * 100) / 100; // Use cents for precision
      
      // Add to user's bonus balance
      await storage.addBonusToWallet(userId, rewardAmount);
      
      gameData.reward = rewardAmount;
    }

    // Record game history
    await storage.createGameHistory({
      userId,
      gameId: game.id,
      outcome: isWin ? 'win' : 'lose',
      rewardAmount: rewardAmount.toString(),
      gameData,
      ipAddress,
      userAgent,
    });

    // Update cooldown
    await this.updateUserCooldown(userId, game.id, game.cooldownMinutes || 60);

    return {
      success: true,
      outcome: isWin ? 'win' : 'lose',
      rewardAmount,
      message: isWin ? `Congratulations! You won $${rewardAmount.toFixed(2)}!` : 'Better luck next time!',
      gameData
    };
  }

  // Play Scratch Card game
  async playScratchCard(userId: string, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    outcome: 'win' | 'lose';
    rewardAmount: number;
    message: string;
    gameData?: any;
  }> {
    const game = await storage.getGameByName('scratch_card');
    if (!game || !game.isActive) {
      return { success: false, outcome: 'lose', rewardAmount: 0, message: 'Game not available' };
    }

    // Check cooldown
    const cooldownCheck = await this.canUserPlay(userId, game.id);
    if (!cooldownCheck.canPlay) {
      return { 
        success: false, 
        outcome: 'lose', 
        rewardAmount: 0, 
        message: `Please wait ${Math.ceil((cooldownCheck.cooldownEndsAt!.getTime() - Date.now()) / 60000)} minutes before playing again` 
      };
    }

    // Generate 3 scratch panels with symbols
    const symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
    const panels: string[] = [];
    for (let i = 0; i < 3; i++) {
      panels.push(symbols[this.generateSecureRandom(0, symbols.length - 1)]);
    }

    // Check for winning combinations
    const isWin = panels.every(panel => panel === panels[0]); // All same symbol
    let rewardAmount = 0;
    let gameData: any = { panels, symbols };

    if (isWin) {
      // Different rewards based on symbol
      const rewardMultipliers: { [key: string]: number } = {
        '🍒': 5, '🍋': 10, '🔔': 15, '⭐': 25, '💎': 50, '7️⃣': 100
      };
      
      const baseReward = rewardMultipliers[panels[0]] || 5;
      rewardAmount = baseReward;
      
      // Add to user's bonus balance
      await storage.addBonusToWallet(userId, rewardAmount);
      
      gameData.reward = rewardAmount;
      gameData.winningSymbol = panels[0];
    }

    // Record game history
    await storage.createGameHistory({
      userId,
      gameId: game.id,
      outcome: isWin ? 'win' : 'lose',
      rewardAmount: rewardAmount.toString(),
      gameData,
      ipAddress,
      userAgent,
    });

    // Update cooldown
    await this.updateUserCooldown(userId, game.id, game.cooldownMinutes || 60);

    return {
      success: true,
      outcome: isWin ? 'win' : 'lose',
      rewardAmount,
      message: isWin ? `🎉 Triple ${panels[0]}! You won $${rewardAmount}!` : 'No match this time. Try again later!',
      gameData
    };
  }

  // Play Number Match game
  async playNumberMatch(userId: string, playerNumbers: number[], ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    outcome: 'win' | 'lose';
    rewardAmount: number;
    message: string;
    gameData?: any;
  }> {
    const game = await storage.getGameByName('number_match');
    if (!game || !game.isActive) {
      return { success: false, outcome: 'lose', rewardAmount: 0, message: 'Game not available' };
    }

    // Validate input
    if (!playerNumbers || playerNumbers.length !== 3 || playerNumbers.some(n => n < 1 || n > 10)) {
      return { success: false, outcome: 'lose', rewardAmount: 0, message: 'Please select 3 numbers between 1-10' };
    }

    // Check cooldown
    const cooldownCheck = await this.canUserPlay(userId, game.id);
    if (!cooldownCheck.canPlay) {
      return { 
        success: false, 
        outcome: 'lose', 
        rewardAmount: 0, 
        message: `Please wait ${Math.ceil((cooldownCheck.cooldownEndsAt!.getTime() - Date.now()) / 60000)} minutes before playing again` 
      };
    }

    // Generate 3 winning numbers (1-10)
    const winningNumbers: number[] = [];
    for (let i = 0; i < 3; i++) {
      winningNumbers.push(this.generateSecureRandom(1, 10));
    }

    // Check matches
    const matches = playerNumbers.filter(num => winningNumbers.includes(num));
    const matchCount = matches.length;
    let rewardAmount = 0;
    let gameData: any = { playerNumbers, winningNumbers, matches, matchCount };

    // Rewards based on match count
    const rewardTable = { 1: 5, 2: 20, 3: 100 };
    if (matchCount > 0) {
      rewardAmount = rewardTable[matchCount as keyof typeof rewardTable] || 0;
      
      // Add to user's bonus balance
      await storage.addBonusToWallet(userId, rewardAmount);
      
      gameData.reward = rewardAmount;
    }

    // Record game history
    await storage.createGameHistory({
      userId,
      gameId: game.id,
      outcome: matchCount > 0 ? 'win' : 'lose',
      rewardAmount: rewardAmount.toString(),
      gameData,
      ipAddress,
      userAgent,
    });

    // Update cooldown
    await this.updateUserCooldown(userId, game.id, game.cooldownMinutes || 60);

    let message = '';
    if (matchCount === 3) {
      message = `🎯 Perfect! All 3 numbers match! Won $${rewardAmount}!`;
    } else if (matchCount === 2) {
      message = `✨ Great! 2 numbers match! Won $${rewardAmount}!`;
    } else if (matchCount === 1) {
      message = `👍 Good! 1 number matches! Won $${rewardAmount}!`;
    } else {
      message = 'No matches this time. Try different numbers!';
    }

    return {
      success: true,
      outcome: matchCount > 0 ? 'win' : 'lose',
      rewardAmount,
      message,
      gameData
    };
  }

  // Update user cooldown after playing
  private async updateUserCooldown(userId: string, gameId: string, cooldownMinutes: number): Promise<void> {
    const now = new Date();
    const nextPlayTime = new Date(now.getTime() + cooldownMinutes * 60 * 1000);
    
    await storage.upsertUserGameCooldown({
      userId,
      gameId,
      lastPlayedAt: now,
      nextPlayAvailableAt: nextPlayTime,
    });
  }

  // Get user's recent game history
  async getUserGameHistory(userId: string, limit: number = 10): Promise<GameHistory[]> {
    return await storage.getUserGameHistory(userId, limit);
  }

  // Get user's game statistics
  async getUserGameStats(userId: string): Promise<{
    totalGames: number;
    totalWins: number;
    totalRewards: number;
    winRate: number;
    gameBreakdown: { [gameName: string]: { plays: number; wins: number; rewards: number } };
  }> {
    const history = await storage.getUserGameHistory(userId, 1000); // Get more for stats
    
    const stats = {
      totalGames: history.length,
      totalWins: history.filter(h => h.outcome === 'win').length,
      totalRewards: history.reduce((sum, h) => sum + parseFloat(h.rewardAmount || '0'), 0),
      winRate: 0,
      gameBreakdown: {} as { [gameName: string]: { plays: number; wins: number; rewards: number } }
    };

    stats.winRate = stats.totalGames > 0 ? (stats.totalWins / stats.totalGames) * 100 : 0;

    // Game breakdown
    for (const record of history) {
      const game = await storage.getGame(record.gameId);
      if (game) {
        if (!stats.gameBreakdown[game.displayName]) {
          stats.gameBreakdown[game.displayName] = { plays: 0, wins: 0, rewards: 0 };
        }
        stats.gameBreakdown[game.displayName].plays++;
        if (record.outcome === 'win') {
          stats.gameBreakdown[game.displayName].wins++;
          stats.gameBreakdown[game.displayName].rewards += parseFloat(record.rewardAmount || '0');
        }
      }
    }

    return stats;
  }

  // Initialize default games - removed sample games, only keep Battle & Dice on separate pages
  async initializeDefaultGames(): Promise<void> {
    // Deactivate existing sample games if they exist
    const samplesToDeactivate = ['spin_wheel', 'scratch_card', 'number_match', 'coin_flip', 'memory_match'];
    
    for (const gameName of samplesToDeactivate) {
      try {
        const existingGame = await storage.getGameByName(gameName);
        if (existingGame && existingGame.isActive) {
          await storage.updateGame(existingGame.id, { isActive: false });
          console.log(`❌ Deactivated sample game: ${existingGame.displayName}`);
        }
      } catch (error) {
        // Game doesn't exist, continue
      }
    }
    
    console.log('🎮 Game Zone cleaned up - only Battle Arena and Dice Game remain active');
  }
}

export const gameService = GameService.getInstance();