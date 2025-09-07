import { ethers } from 'ethers';
import crypto from 'crypto';
import QRCode from 'qrcode';

// USDT Contract addresses on different networks
export const USDT_CONTRACTS = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum USDT
  bsc: '0x55d398326f99059fF775485246999027B3197955', // BSC USDT
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon USDT
};

// Network configurations
export const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    chainId: 1,
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io',
  },
  bsc: {
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    symbol: 'BNB',
    blockExplorer: 'https://bscscan.com',
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
  },
};

// USDT ABI (simplified for transfer events)
const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export class CryptoService {
  private providers: { [key: string]: ethers.JsonRpcProvider } = {};

  constructor() {
    // Initialize providers for each network
    for (const [network, config] of Object.entries(NETWORKS)) {
      this.providers[network] = new ethers.JsonRpcProvider(config.rpcUrl);
    }
  }

  // Generate unique deposit address for user
  generateDepositAddress(userId: string, network: string): string {
    // In production, use proper wallet derivation with HD wallets
    // For now, generate deterministic address from user ID
    const seed = `${userId}_${network}_${process.env.CRYPTO_SEED || 'lottery_app'}`;
    const mnemonic = ethers.Mnemonic.fromEntropy(crypto.createHash('sha256').update(seed).digest());
    const wallet = ethers.Wallet.fromPhrase(mnemonic.phrase);
    return wallet.address;
  }

  // Generate QR code for deposit address
  async generateDepositQR(address: string, network: string, amount?: number): Promise<string> {
    let qrData = address;
    
    // Create payment URL format for better wallet compatibility
    if (network === 'ethereum') {
      qrData = `ethereum:${address}`;
    } else if (network === 'bsc') {
      qrData = `binancecoin:${address}`;
    } else if (network === 'polygon') {
      qrData = `polygon:${address}`;
    }

    if (amount) {
      qrData += `?value=${amount}`;
    }

    return await QRCode.toDataURL(qrData);
  }

  // Check USDT balance for an address
  async getUSDTBalance(address: string, network: string): Promise<string> {
    try {
      const provider = this.providers[network];
      const contract = new ethers.Contract(USDT_CONTRACTS[network as keyof typeof USDT_CONTRACTS], USDT_ABI, provider);
      
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error(`Error checking USDT balance for ${network}:`, error);
      return '0';
    }
  }

  // Monitor incoming USDT transactions
  async monitorDeposits(address: string, network: string, callback: (txHash: string, amount: string) => void) {
    try {
      const provider = this.providers[network];
      const contract = new ethers.Contract(USDT_CONTRACTS[network as keyof typeof USDT_CONTRACTS], USDT_ABI, provider);
      
      // Listen for Transfer events to this address
      contract.on('Transfer', async (from, to, amount, event) => {
        if (to.toLowerCase() === address.toLowerCase()) {
          const decimals = await contract.decimals();
          const formattedAmount = ethers.formatUnits(amount, decimals);
          callback(event.transactionHash, formattedAmount);
        }
      });

      console.log(`🔍 Monitoring USDT deposits on ${network} for address: ${address}`);
    } catch (error) {
      console.error(`Error setting up monitoring for ${network}:`, error);
    }
  }

  // Verify transaction on blockchain
  async verifyTransaction(txHash: string, network: string, expectedAddress: string): Promise<{
    isValid: boolean;
    amount?: string;
    fromAddress?: string;
    blockNumber?: number;
  }> {
    try {
      const provider = this.providers[network];
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { isValid: false };
      }

      const contract = new ethers.Contract(USDT_CONTRACTS[network as keyof typeof USDT_CONTRACTS], USDT_ABI, provider);
      
      // Parse transfer events
      const transferEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === USDT_CONTRACTS[network as keyof typeof USDT_CONTRACTS].toLowerCase())
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(event => event && event.name === 'Transfer');

      const relevantTransfer = transferEvents.find(event => 
        event && event.args.to.toLowerCase() === expectedAddress.toLowerCase()
      );

      if (relevantTransfer) {
        const decimals = await contract.decimals();
        const amount = ethers.formatUnits(relevantTransfer.args.value, decimals);
        
        return {
          isValid: true,
          amount,
          fromAddress: relevantTransfer.args.from,
          blockNumber: receipt.blockNumber,
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error(`Error verifying transaction ${txHash} on ${network}:`, error);
      return { isValid: false };
    }
  }

  // Get current USDT price in USD (simplified - in production use price oracles)
  async getUSDTPrice(): Promise<number> {
    // USDT is pegged to $1, but in production you'd want real-time price feeds
    return 1.0;
  }

  // Convert USDT amount to lottery credits (1 USDT = 1 credit for simplicity)
  convertUSDTToCredits(usdtAmount: string): number {
    return Math.floor(parseFloat(usdtAmount));
  }
}

export const cryptoService = new CryptoService();