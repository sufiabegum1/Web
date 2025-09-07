import { storage } from '../server/storage';

async function initializeTradingData() {
  console.log('🔧 Initializing trading system data...');

  try {
    // Create trading instruments
    const instruments = [
      {
        symbol: 'BTCUSD',
        name: 'Bitcoin / US Dollar',
        type: 'crypto',
        description: 'The world\'s largest cryptocurrency paired with the US Dollar',
        isActive: true,
        minTradeAmount: '1.00',
        maxTradeAmount: '1000.00',
        payoutMultiplier: '1.95'
      },
      {
        symbol: 'ETHUSD',
        name: 'Ethereum / US Dollar',
        type: 'crypto',
        description: 'The second largest cryptocurrency paired with the US Dollar',
        isActive: true,
        minTradeAmount: '1.00',
        maxTradeAmount: '1000.00',
        payoutMultiplier: '1.95'
      },
      {
        symbol: 'EURUSD',
        name: 'Euro / US Dollar',
        type: 'forex',
        description: 'The most traded currency pair in the forex market',
        isActive: true,
        minTradeAmount: '1.00',
        maxTradeAmount: '500.00',
        payoutMultiplier: '1.95'
      }
    ];

    // Check if instruments already exist
    const existingInstruments = await storage.getTradingInstruments();
    console.log(`📊 Found ${existingInstruments.length} existing trading instruments`);

    if (existingInstruments.length === 0) {
      for (const instrument of instruments) {
        console.log(`📈 Creating trading instrument: ${instrument.symbol} - ${instrument.name}`);
        await storage.createTradingInstrument(instrument);
      }
      console.log('✅ Trading instruments created successfully');
    } else {
      console.log('ℹ️ Trading instruments already exist, skipping creation');
    }

    // Initialize trading pot balances
    const tradingPots = await storage.getTradingPots();
    console.log(`💰 Found ${tradingPots.length} trading pots`);

    if (tradingPots.length === 0) {
      console.log('💰 Creating initial trading pot with balance');
      // The trading pot is automatically created with the seed in the schema
    } else {
      console.log('ℹ️ Trading pots already exist');
    }

    console.log('🎯 Trading system initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing trading data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeTradingData().then(() => {
    console.log('✅ Trading initialization completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Trading initialization failed:', error);
    process.exit(1);
  });
}

export { initializeTradingData };