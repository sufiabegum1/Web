import WebSocket from 'ws';
import cron from 'node-cron';
import { storage } from '../storage';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  source: string;
}

class PriceService {
  private priceCache: Map<string, PriceData> = new Map();
  private wsClients: Set<WebSocket> = new Set();
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializePriceUpdates();
  }

  // Initialize periodic price updates
  private initializePriceUpdates() {
    // Update prices every 5 seconds
    this.priceUpdateInterval = setInterval(async () => {
      await this.fetchAllPrices();
      this.broadcastPrices();
    }, 5000);

    // Initial fetch
    this.fetchAllPrices();

    console.log('📈 Price service initialized with 5-second updates');
  }

  // Fetch prices from various APIs
  private async fetchAllPrices() {
    try {
      // Fetch crypto prices from CoinGecko
      await this.fetchCryptoPrices();
      
      // Fetch forex prices from Frankfurter
      await this.fetchForexPrices();
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
    }
  }

  // Fetch BTC/USD and ETH/USD from CoinGecko
  private async fetchCryptoPrices() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const timestamp = new Date();

      // Update BTC/USD
      if (data.bitcoin?.usd) {
        const btcPrice: PriceData = {
          symbol: 'BTCUSD',
          price: data.bitcoin.usd,
          timestamp,
          source: 'coingecko'
        };
        this.priceCache.set('BTCUSD', btcPrice);
        await this.savePriceHistory(btcPrice);
      }

      // Update ETH/USD
      if (data.ethereum?.usd) {
        const ethPrice: PriceData = {
          symbol: 'ETHUSD',
          price: data.ethereum.usd,
          timestamp,
          source: 'coingecko'
        };
        this.priceCache.set('ETHUSD', ethPrice);
        await this.savePriceHistory(ethPrice);
      }
    } catch (error) {
      console.error('❌ Error fetching crypto prices:', error);
    }
  }

  // Fetch EUR/USD from Frankfurter
  private async fetchForexPrices() {
    try {
      const response = await fetch(
        'https://api.frankfurter.app/latest?from=EUR&to=USD'
      );
      
      if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.status}`);
      }

      const data = await response.json();
      const timestamp = new Date();

      if (data.rates?.USD) {
        const eurPrice: PriceData = {
          symbol: 'EURUSD',
          price: data.rates.USD,
          timestamp,
          source: 'frankfurter'
        };
        this.priceCache.set('EURUSD', eurPrice);
        await this.savePriceHistory(eurPrice);
      }
    } catch (error) {
      console.error('❌ Error fetching forex prices:', error);
    }
  }

  // Save price to database history
  private async savePriceHistory(priceData: PriceData) {
    try {
      const instruments = await storage.getTradingInstruments();
      const instrument = instruments.find(i => i.symbol === priceData.symbol);
      
      if (instrument) {
        await storage.savePriceHistory({
          instrumentId: instrument.id,
          price: priceData.price.toString(),
          timestamp: priceData.timestamp,
          source: priceData.source
        });
      }
    } catch (error) {
      console.error('❌ Error saving price history:', error);
    }
  }

  // Get current price for a symbol
  getCurrentPrice(symbol: string): PriceData | null {
    return this.priceCache.get(symbol) || null;
  }

  // Get all current prices
  getAllPrices(): PriceData[] {
    return Array.from(this.priceCache.values());
  }

  // Add WebSocket client for real-time updates
  addWebSocketClient(ws: WebSocket) {
    this.wsClients.add(ws);
    
    // Send current prices immediately
    const prices = this.getAllPrices();
    if (prices.length > 0) {
      ws.send(JSON.stringify({
        type: 'prices',
        data: prices
      }));
    }

    // Handle client disconnect
    ws.on('close', () => {
      this.wsClients.delete(ws);
    });

    console.log(`📡 WebSocket client connected. Total clients: ${this.wsClients.size}`);
  }

  // Broadcast price updates to all connected WebSocket clients
  private broadcastPrices() {
    if (this.wsClients.size === 0) return;

    const prices = this.getAllPrices();
    const message = JSON.stringify({
      type: 'prices',
      data: prices
    });

    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        this.wsClients.delete(ws);
      }
    });
  }

  // Get price at specific timestamp for trade settlement
  async getPriceAtTime(symbol: string, timestamp: Date): Promise<number | null> {
    try {
      const priceHistory = await storage.getPriceHistory(symbol, timestamp);
      return priceHistory ? parseFloat(priceHistory.price) : null;
    } catch (error) {
      console.error('❌ Error getting historical price:', error);
      return null;
    }
  }

  // Check if prices are fresh (within last 30 seconds)
  isPriceStale(symbol: string): boolean {
    const price = this.priceCache.get(symbol);
    if (!price) return true;
    
    const now = new Date();
    const timeDiff = now.getTime() - price.timestamp.getTime();
    return timeDiff > 30000; // 30 seconds
  }

  // Cleanup
  destroy() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    
    this.wsClients.clear();
    console.log('📈 Price service destroyed');
  }
}

export const priceService = new PriceService();