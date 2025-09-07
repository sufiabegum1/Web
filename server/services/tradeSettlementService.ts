import cron from 'node-cron';
import { storage } from '../storage';
import { priceService } from './priceService';

class TradeSettlementService {
  private settlementInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSettlement();
  }

  private initializeSettlement() {
    // Check for expired trades every 30 seconds
    this.settlementInterval = setInterval(async () => {
      await this.settleExpiredTrades();
    }, 30000);

    console.log('🎯 Trade settlement service initialized with 30-second checks');
  }

  async settleExpiredTrades() {
    try {
      const activeTrades = await storage.getActiveBinaryTrades();
      const now = new Date();

      // Filter trades that have expired
      const expiredTrades = activeTrades.filter(trade => 
        trade.expiryTime && new Date(trade.expiryTime) <= now
      );

      if (expiredTrades.length === 0) {
        return;
      }

      console.log(`⏰ Found ${expiredTrades.length} expired trades to settle`);

      for (const trade of expiredTrades) {
        await this.settleTrade(trade);
      }

    } catch (error) {
      console.error('❌ Error settling expired trades:', error);
    }
  }

  private async settleTrade(trade: any) {
    try {
      if (!trade.instrument || !trade.user) {
        console.error(`❌ Trade ${trade.id} missing instrument or user data`);
        return;
      }

      // Get exit price at expiry time
      let exitPrice = await priceService.getPriceAtTime(
        trade.instrument.symbol, 
        new Date(trade.expiryTime)
      );

      // If no historical price found, use latest available price
      if (!exitPrice) {
        const latestPrice = await storage.getLatestPrice(trade.instrument.symbol);
        exitPrice = latestPrice ? parseFloat(latestPrice.price) : null;
      }

      if (!exitPrice) {
        console.error(`❌ No exit price available for trade ${trade.id}`);
        // Mark trade as error status
        await storage.updateBinaryTrade(trade.id, {
          status: 'error',
          settledAt: new Date(),
        });
        return;
      }

      const entryPrice = parseFloat(trade.entryPrice);
      const tradeAmount = parseFloat(trade.stakeAmount);
      const payoutMultiplier = parseFloat(trade.instrument.payoutMultiplier);

      // Determine if trade won
      let isWinner = false;
      if (trade.direction === 'up') {
        isWinner = exitPrice > entryPrice;
      } else if (trade.direction === 'down') {
        isWinner = exitPrice < entryPrice;
      }

      const status = isWinner ? 'won' : 'lost';
      const payoutAmount = isWinner ? (tradeAmount * payoutMultiplier).toString() : '0';

      // Update trade status
      await storage.settleBinaryTrade(trade.id, exitPrice.toString(), status, payoutAmount);

      // If trade won, add payout to user wallet
      if (isWinner) {
        const wallet = await storage.getWallet(trade.userId!);
        if (wallet) {
          const currentBalance = parseFloat(wallet.balance);
          const payout = parseFloat(payoutAmount);
          const newBalance = (currentBalance + payout).toString();
          
          await storage.updateWalletBalance(trade.userId!, payout.toString());

          // Create transaction record
          await storage.createTransaction({
            walletId: wallet.id,
            type: "binary_trade_win",
            amount: payout.toString(),
            description: `Binary trade win: ${trade.instrument.symbol} - ${trade.direction.toUpperCase()}`,
            status: "confirmed",
          });

          console.log(`🎉 Trade ${trade.id} won! Payout: $${payout} to user ${trade.user.email}`);
        }
      } else {
        console.log(`💸 Trade ${trade.id} lost. Entry: $${entryPrice}, Exit: $${exitPrice}`);
      }

      // Add audit log
      await storage.addTradeAuditLog({
        tradeId: trade.id,
        action: 'trade_settled',
        details: `Trade settled: ${status} - Entry: $${entryPrice}, Exit: $${exitPrice}, Payout: $${payoutAmount}`,
      });

    } catch (error) {
      console.error(`❌ Error settling trade ${trade.id}:`, error);
      
      // Mark trade as error if settlement fails
      try {
        await storage.updateBinaryTrade(trade.id, {
          status: 'error',
          settledAt: new Date(),
        });
      } catch (updateError) {
        console.error(`❌ Failed to mark trade ${trade.id} as error:`, updateError);
      }
    }
  }

  // Manual settlement trigger for admin
  async forceSettleTrade(tradeId: string): Promise<boolean> {
    try {
      const trade = await storage.getBinaryTrade(tradeId);
      if (!trade) {
        return false;
      }

      // Get full trade data with relations
      const activeTrades = await storage.getActiveBinaryTrades();
      const fullTrade = activeTrades.find(t => t.id === tradeId);
      
      if (!fullTrade) {
        return false;
      }

      await this.settleTrade(fullTrade);
      return true;
    } catch (error) {
      console.error(`❌ Error force settling trade ${tradeId}:`, error);
      return false;
    }
  }

  // Get settlement statistics
  async getSettlementStats(): Promise<{
    totalSettled: number;
    totalWon: number;
    totalLost: number;
    totalPayout: string;
  }> {
    try {
      // This would need additional database queries
      // For now, return placeholder stats
      return {
        totalSettled: 0,
        totalWon: 0,
        totalLost: 0,
        totalPayout: '0',
      };
    } catch (error) {
      console.error('❌ Error getting settlement stats:', error);
      return {
        totalSettled: 0,
        totalWon: 0,
        totalLost: 0,
        totalPayout: '0',
      };
    }
  }

  // Cleanup
  destroy() {
    if (this.settlementInterval) {
      clearInterval(this.settlementInterval);
    }
    console.log('🎯 Trade settlement service destroyed');
  }
}

export const tradeSettlementService = new TradeSettlementService();