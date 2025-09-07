import { storage } from "../storage";
import { cryptoService } from "./cryptoService";
import cron from "node-cron";

class CryptoMonitorService {
  private monitoringAddresses = new Set<string>();

  async startMonitoring() {
    console.log("🔍 Starting crypto deposit monitoring service...");
    
    // Monitor every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await this.checkPendingDeposits();
    });

    console.log("✅ Crypto monitoring service initialized");
  }

  async checkPendingDeposits() {
    try {
      // Get all active crypto addresses
      const addresses = await this.getAllActiveAddresses();
      
      for (const address of addresses) {
        if (!this.monitoringAddresses.has(address.id)) {
          await this.setupAddressMonitoring(address);
          this.monitoringAddresses.add(address.id);
        }
      }
    } catch (error) {
      console.error("Error checking pending deposits:", error);
    }
  }

  private async getAllActiveAddresses() {
    try {
      // This would be implemented in storage - for now return empty array
      return [];
    } catch (error) {
      console.error("Error fetching active addresses:", error);
      return [];
    }
  }

  private async setupAddressMonitoring(address: any) {
    try {
      cryptoService.monitorDeposits(
        address.address,
        address.network,
        async (txHash: string, amount: string) => {
          await this.processDeposit(address, txHash, amount);
        }
      );
    } catch (error) {
      console.error(`Error setting up monitoring for ${address.address}:`, error);
    }
  }

  private async processDeposit(address: any, txHash: string, amount: string) {
    try {
      console.log(`💰 New USDT deposit detected: ${amount} USDT to ${address.address}`);
      
      // Verify the transaction
      const verification = await cryptoService.verifyTransaction(
        txHash,
        address.network,
        address.address
      );

      if (!verification.isValid) {
        console.log(`❌ Invalid transaction: ${txHash}`);
        return;
      }

      // Get user wallet
      const wallet = await storage.getWallet(address.userId);
      if (!wallet) {
        console.log(`❌ Wallet not found for user: ${address.userId}`);
        return;
      }

      // Convert USDT to credits and update balance
      const credits = cryptoService.convertUSDTToCredits(verification.amount!);
      await storage.updateWalletBalance(address.userId, credits.toString());

      // Create transaction record
      await storage.createTransaction({
        walletId: wallet.id,
        type: "crypto_deposit",
        amount: credits.toString(),
        description: `Auto USDT deposit from ${address.network.toUpperCase()}`,
        cryptoNetwork: address.network,
        cryptoTxHash: txHash,
        cryptoAddress: address.address,
        status: "confirmed",
      });

      console.log(`✅ Deposit processed: ${credits} credits added to user ${address.userId}`);
    } catch (error) {
      console.error("Error processing deposit:", error);
    }
  }
}

export const cryptoMonitor = new CryptoMonitorService();