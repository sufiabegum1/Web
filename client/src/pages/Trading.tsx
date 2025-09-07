import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
  Area,
  ComposedChart,
} from "recharts";
// Utils functions for formatting
const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  Star,
  History,
} from "lucide-react";
import TradeVisualization from "@/components/TradeVisualization";

interface TradingInstrument {
  id: string;
  symbol: string;
  name: string;
  type: string;
  isActive: boolean;
  minTradeAmount: string;
  maxTradeAmount: string;
  payoutMultiplier: string;
}

interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  source: string;
}

interface BinaryTrade {
  id: string;
  userId: string;
  instrumentId: string;
  direction: string;
  stakeAmount: string;
  entryPrice: string;
  exitPrice?: string;
  duration: number;
  entryTime: Date;
  expiryTime: Date;
  status: string;
  payoutAmount?: string;
  settledAt?: Date;
  createdAt: Date;
  instrument: TradingInstrument;
}

export default function Trading() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [amount, setAmount] = useState<string>("10");
  const [duration, setDuration] = useState<string>("1");
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [priceHistory, setPriceHistory] = useState<
    Array<{
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
      price: number;
      ma10?: number;
      ma20?: number;
    }>
  >([]);
  const [activeTradeVisualization, setActiveTradeVisualization] = useState<BinaryTrade | null>(null);
  const [showTradeVisualization, setShowTradeVisualization] = useState(false);


  // Fetch trading instruments
  const { data: instruments = [] } = useQuery<TradingInstrument[]>({
    queryKey: ["/api/trading/instruments"],
    enabled: !!user,
  });

  // Fetch current prices
  const pricesQuery = useQuery<PriceData[]>({
    queryKey: ["/api/trading/prices"],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  const currentPrices = pricesQuery.data || [];

  // Fetch user's trades
  const { data: userTrades = [] } = useQuery<BinaryTrade[]>({
    queryKey: ["/api/trading/my-trades"],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Place trade mutation
  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      return await apiRequest("POST", "/api/trading/place-trade", tradeData);
    },
    onSuccess: (response) => {
      toast({
        title: "Trade Placed Successfully!",
        description: "Your trade has been placed and is now active.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/my-trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Show 3D visualization for the new trade
      if (response.trade) {
        setActiveTradeVisualization({
          ...response.trade,
          instrument: selectedInstrumentData
        });
        setShowTradeVisualization(true);
      }
      
      setAmount("10");
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade",
        variant: "destructive",
      });
    },
  });

  // Update prices in state
  useEffect(() => {
    if (currentPrices.length > 0) {
      setPrices(currentPrices);

      // Build price history for selected instrument
      if (selectedInstrument) {
        const selectedInstrumentData = instruments.find(
          (i) => i.id === selectedInstrument,
        );
        const instrumentPrice = currentPrices.find(
          (p) => p.symbol === selectedInstrumentData?.symbol,
        );
        if (instrumentPrice && selectedInstrumentData) {
          const now = new Date().toLocaleTimeString();

          setPriceHistory((prev) => {
            // Generate realistic OHLC candlestick data
            const price = instrumentPrice.price;
            const variation = price * 0.001; // 0.1% variation for realistic candles
            const random1 = (Math.random() - 0.5) * variation;
            const random2 = (Math.random() - 0.5) * variation;
            const random3 = (Math.random() - 0.5) * variation;

            const lastCandle = prev[prev.length - 1];
            const open = lastCandle ? lastCandle.close : price;
            const high = Math.max(open, price, price + Math.abs(random1));
            const low = Math.min(open, price, price - Math.abs(random2));
            const close = price;

            const newHistory = [
              ...prev,
              {
                time: now,
                open,
                high,
                low,
                close,
                price: price, // Keep for MA calculations
              },
            ];

            // Keep only last 20 data points
            const trimmedHistory = newHistory.slice(-20);

            // Calculate moving averages
            return trimmedHistory.map((point, index) => {
              const subset = trimmedHistory.slice(
                Math.max(0, index - 9),
                index + 1,
              );
              const ma10 =
                index >= 9
                  ? subset.reduce((sum, p) => sum + p.close, 0) / subset.length
                  : undefined;

              const subset20 = trimmedHistory.slice(
                Math.max(0, index - 19),
                index + 1,
              );
              const ma20 =
                index >= 19
                  ? subset20.reduce((sum, p) => sum + p.close, 0) /
                    subset20.length
                  : undefined;

              return { ...point, ma10, ma20 };
            });
          });
        }
      }
    }
  }, [currentPrices, selectedInstrument]);

  // Auto-select first instrument and reset price history when changing
  useEffect(() => {
    if (instruments.length > 0 && !selectedInstrument) {
      setSelectedInstrument(instruments[0].id);
    }
  }, [instruments, selectedInstrument]);

  // Clear price history when changing instruments
  useEffect(() => {
    setPriceHistory([]);
  }, [selectedInstrument]);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access trading.</div>;
  }

  const selectedInstrumentData = instruments.find(
    (i) => i.id === selectedInstrument,
  );
  const currentPrice = prices.find(
    (p) => p.symbol === selectedInstrumentData?.symbol,
  );

  const handlePlaceTrade = () => {
    if (!selectedInstrument || !amount || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const tradeAmount = parseFloat(amount);
    const minAmount = parseFloat(selectedInstrumentData?.minTradeAmount || "1");
    const maxAmount = parseFloat(
      selectedInstrumentData?.maxTradeAmount || "1000",
    );

    if (tradeAmount < minAmount || tradeAmount > maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between $${minAmount} and $${maxAmount}`,
        variant: "destructive",
      });
      return;
    }

    placeTradeMutation.mutate({
      instrumentId: selectedInstrument,
      direction,
      amount: tradeAmount.toString(),
      expiryMinutes: parseInt(duration),
    });
  };

  const getPriceChangeColor = (symbol: string) => {
    // This would need historical data to show actual price changes
    // For now, we'll use a simple indicator
    return Math.random() > 0.5 ? "text-green-600" : "text-red-600";
  };

  const activeTrades = userTrades.filter((trade) => trade.status === "active");
  const recentTrades = userTrades.slice(0, 5);

  // Get current price for active trade visualization
  const currentVisualizationPrice = activeTradeVisualization && activeTradeVisualization.instrument
    ? currentPrices.find(p => p.symbol === activeTradeVisualization.instrument.symbol)?.price || 0
    : 0;

  // Monitor trades and automatically manage visualization
  useEffect(() => {
    const activeTrades = userTrades.filter((trade) => trade.status === "active");
    
    if (activeTrades.length > 0) {
      // If there are active trades, show the most recent one
      const mostRecentTrade = activeTrades[activeTrades.length - 1];
      
      // Only update if it's a different trade or if no visualization is currently shown
      if (!activeTradeVisualization || 
          !showTradeVisualization || 
          activeTradeVisualization.id !== mostRecentTrade.id) {
        
        const instrumentData = instruments.find(i => i.id === mostRecentTrade.instrumentId);
        if (instrumentData) {
          setActiveTradeVisualization({
            ...mostRecentTrade,
            instrument: instrumentData
          });
          setShowTradeVisualization(true);
        }
      }
    } else if (showTradeVisualization) {
      // No active trades, hide visualization
      setShowTradeVisualization(false);
      setActiveTradeVisualization(null);
    }
  }, [userTrades, instruments, activeTradeVisualization, showTradeVisualization]);

  // Handle trade completion callback
  const handleTradeComplete = () => {
    // Force refresh trades data
    queryClient.invalidateQueries({ queryKey: ["/api/trading/my-trades"] });
    
    // The useEffect above will handle showing new active trades automatically
    setTimeout(() => {
      const activeTrades = userTrades.filter((trade) => trade.status === "active");
      if (activeTrades.length === 0) {
        setShowTradeVisualization(false);
        setActiveTradeVisualization(null);
      }
    }, 500); // Small delay to allow data refresh
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Mobile-first header */}
        <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Secure Trading
                  </h1>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    Secure Trading Platform
                  </p>
                </div>
              </div>
              {currentPrice && (
                <div className="text-right">
                  <div className="text-sm font-mono text-white">
                    ${currentPrice.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 max-w-7xl mx-auto space-y-4">
          {/* Main Trading Container */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Trading Panel - Mobile First */}
            <div className="xl:col-span-3 space-y-4">
              {/* Instrument Selection Card */}
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Trading Instrument
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Modern Instrument Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {instruments.map((instrument) => (
                      <Button
                        key={instrument.id}
                        variant={
                          selectedInstrument === instrument.id
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedInstrument(instrument.id)}
                        className={`p-4 h-auto transition-all duration-200 ${
                          selectedInstrument === instrument.id
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 shadow-lg shadow-blue-500/25"
                            : "bg-gray-800/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500"
                        }`}
                        data-testid={`instrument-${instrument.symbol}`}
                      >
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div className="flex items-center gap-2">
                            {instrument.type === "crypto" ? (
                              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                                <DollarSign className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <span className="font-semibold text-white">
                              {instrument.symbol}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-green-400 font-mono">
                              {instrument.payoutMultiplier}x
                            </span>
                            <Badge variant="outline" className="text-xs h-5">
                              {instrument.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Live Chart Card */}
              {selectedInstrument && (
                <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Activity className="w-5 h-5 text-green-400" />
                        Live Chart
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-mono">
                            LIVE
                          </span>
                        </div>
                        <Badge className="bg-blue-600 text-white text-xs">
                          {
                            instruments.find((i) => i.id === selectedInstrument)
                              ?.symbol
                          }
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Price Header */}
                    {currentPrice && selectedInstrumentData && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-xl border border-gray-600/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-white font-mono">
                              $
                              {currentPrice.price.toFixed(
                                currentPrice.symbol === "EURUSD" ? 4 : 2,
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-300">
                                {selectedInstrumentData.name}
                              </span>
                              <span className="text-xs text-green-400">
                                {selectedInstrumentData.payoutMultiplier}x
                                Payout
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">
                              Last Update
                            </div>
                            <div className="text-xs text-blue-400 font-mono">
                              {new Date(
                                currentPrice.timestamp,
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chart Container */}
                    <div className="relative">
                      {/* Conditional Chart Display */}
                      {activeTrades.length > 0 ? (
                        <div className="relative">
                          <TradeVisualization
                            trade={{
                              ...activeTrades[0],
                              direction: activeTrades[0].direction as 'up' | 'down',
                              instrument: activeTrades[0].instrument
                            }}
                            currentPrice={currentVisualizationPrice}
                            isActive={true}
                            onTradeComplete={handleTradeComplete}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="h-64 sm:h-80 w-full bg-gray-900/50 rounded-xl border border-gray-600/30 overflow-hidden">
                            <iframe
                              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${
                                instruments.find((i) => i.id === selectedInstrument)
                                  ?.symbol === "BTCUSD"
                                  ? "BINANCE:BTCUSDT"
                                  : instruments.find(
                                        (i) => i.id === selectedInstrument,
                                      )?.symbol === "ETHUSD"
                                    ? "BINANCE:ETHUSDT"
                                    : instruments.find(
                                          (i) => i.id === selectedInstrument,
                                        )?.symbol === "EURUSD"
                                      ? "FX:EURUSD"
                                      : "BINANCE:BTCUSDT"
                              }&interval=1&hideideas=1&hidetoptoolbar=1&hidelegend=0&saveimage=0&toolbarbg=1e1e1e&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
                              className="w-full h-full border-0"
                              title="Live Trading Chart"
                            />
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-gray-900/80 backdrop-blur rounded-lg px-3 py-1.5 flex items-center justify-center gap-2">
                              <span className="text-xs text-gray-300">
                                📊 Professional Candlesticks
                              </span>
                              <span className="text-xs text-green-400">
                                🟢 Bullish
                              </span>
                              <span className="text-xs text-red-400">
                                🔴 Bearish
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trading Action Card */}
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Place Trade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Modern Direction Selection */}
                  <div className="space-y-3">
                    <Label className="text-white text-lg font-semibold">
                      Choose Direction
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant={direction === "up" ? "default" : "outline"}
                        onClick={() => setDirection("up")}
                        className={`p-6 h-auto transition-all duration-300 ${
                          direction === "up"
                            ? "bg-gradient-to-r from-green-600 to-green-700 border-green-500 shadow-lg shadow-green-500/25 scale-105"
                            : "bg-gray-800/30 border-gray-600 hover:bg-gray-700/50 hover:border-green-500/50 hover:shadow-green-500/10"
                        }`}
                        data-testid="button-direction-up"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={`p-3 rounded-full ${direction === "up" ? "bg-white/20" : "bg-green-500/20"}`}
                          >
                            <TrendingUp className="w-8 h-8 text-green-400" />
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-lg text-white block">
                              CALL (UP)
                            </span>
                            <span className="text-sm text-gray-300">
                              Price will rise
                            </span>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant={direction === "down" ? "default" : "outline"}
                        onClick={() => setDirection("down")}
                        className={`p-6 h-auto transition-all duration-300 ${
                          direction === "down"
                            ? "bg-gradient-to-r from-red-600 to-red-700 border-red-500 shadow-lg shadow-red-500/25 scale-105"
                            : "bg-gray-800/30 border-gray-600 hover:bg-gray-700/50 hover:border-red-500/50 hover:shadow-red-500/10"
                        }`}
                        data-testid="button-direction-down"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={`p-3 rounded-full ${direction === "down" ? "bg-white/20" : "bg-red-500/20"}`}
                          >
                            <TrendingDown className="w-8 h-8 text-red-400" />
                          </div>
                          <div className="text-center">
                            <span className="font-bold text-lg text-white block">
                              PUT (DOWN)
                            </span>
                            <span className="text-sm text-gray-300">
                              Price will fall
                            </span>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Trade Settings */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Amount Input */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="amount"
                          className="text-white font-medium flex items-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Investment Amount
                        </Label>
                        <div className="relative">
                          <Input
                            id="amount"
                            type="number"
                            min={selectedInstrumentData?.minTradeAmount || "1"}
                            max={
                              selectedInstrumentData?.maxTradeAmount || "1000"
                            }
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-gray-800/50 border-gray-600 text-white text-lg font-mono pl-8 h-12"
                            placeholder="1.00"
                            data-testid="input-trade-amount"
                          />
                          <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        {selectedInstrumentData && (
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>
                              Min: $1.00
                            </span>
                            <span>
                              Max: ${selectedInstrumentData.maxTradeAmount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Duration Selection */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="duration"
                          className="text-white font-medium flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          Expiry Time
                        </Label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger
                            data-testid="select-duration"
                            className="bg-gray-800/50 border-gray-600 text-white h-12"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem
                              value="1"
                              data-testid="duration-1"
                              className="text-white hover:bg-gray-700"
                            >
                              1 Minute
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Payout Calculator */}
                    {amount && selectedInstrumentData && (
                      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-300">
                              Investment
                            </div>
                            <div className="text-xl font-bold text-white font-mono">
                              ${amount}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-300">
                              Potential Return
                            </div>
                            <div className="text-xl font-bold text-green-400 font-mono">
                              $
                              {(
                                parseFloat(amount) *
                                parseFloat(
                                  selectedInstrumentData.payoutMultiplier,
                                )
                              ).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-600/30 text-center">
                          <div className="text-sm text-gray-300">
                            Net Profit if Correct
                          </div>
                          <div className="text-2xl font-bold text-green-400 font-mono">
                            +$
                            {(
                              parseFloat(amount) *
                                parseFloat(
                                  selectedInstrumentData.payoutMultiplier,
                                ) -
                              parseFloat(amount)
                            ).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Place Trade Button */}
                  <Button
                    onClick={handlePlaceTrade}
                    disabled={
                      placeTradeMutation.isPending ||
                      !selectedInstrument ||
                      !currentPrice
                    }
                    className={`w-full h-14 text-lg font-bold transition-all duration-300 ${
                      direction === "up"
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/25"
                        : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/25"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    data-testid="button-place-trade"
                  >
                    {placeTradeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Placing Trade...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {direction === "up" ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                        Place {direction === "up" ? "CALL" : "PUT"} Trade
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Mobile Responsive */}
            <div className="xl:col-span-1 space-y-4">
              {/* Active Trades */}
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-orange-400" />
                    Active Trades
                    <Badge className="bg-orange-600 text-white text-xs ml-auto">
                      {activeTrades.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTrades.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <p className="text-gray-400">No active trades</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Your active positions will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {activeTrades.map((trade) => (
                        <div
                          key={trade.id}
                          className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${trade.direction === "up" ? "bg-green-400" : "bg-red-400"}`}
                              />
                              <div>
                                <p className="font-semibold text-white">
                                  {trade.instrument.symbol}
                                </p>
                                <p className="text-sm text-gray-300">
                                  ${trade.stakeAmount} •{" "}
                                  {trade.direction.toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={`${trade.direction === "up" ? "bg-green-600" : "bg-red-600"} text-white`}
                            >
                              {trade.direction === "up" ? "📈" : "📉"}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">
                              {`Entry: $${parseFloat(trade.entryPrice).toFixed(2)}`}
                            </span>
                            <span className="text-orange-400 font-mono text-xs">
                              {formatDateTime(new Date(trade.expiryTime))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Overview */}
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl">
                <CardContent>
                  {pricesQuery.data && pricesQuery.data.length > 0 ? (
                    <div className="space-y-3">
                      {pricesQuery.data.map((price, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl border border-gray-600/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {price.symbol.slice(0, 3)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {price.symbol}
                              </p>
                              <p className="text-xs text-gray-400">
                                {price.source}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white font-mono">
                              $
                              {price.price.toFixed(
                                price.symbol === "EURUSD" ? 4 : 2,
                              )}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                              {new Date(price.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Star className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <p className="text-gray-400">Loading prices...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent History */}
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <History className="w-5 h-5 text-blue-400" />
                    Recent Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTrades.length === 0 ? (
                    <div className="text-center py-6">
                      <History className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <p className="text-gray-400">No recent trades</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Your trading history will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {recentTrades.map((trade) => (
                        <div
                          key={trade.id}
                          className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${trade.direction === "up" ? "bg-green-400" : "bg-red-400"}`}
                              />
                              <div>
                                <p className="font-semibold text-white">
                                  {trade.instrument.symbol}
                                </p>
                                <p className="text-sm text-gray-300">
                                  ${trade.stakeAmount} •{" "}
                                  {trade.direction.toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={
                                trade.status === "won"
                                  ? "bg-green-600 text-white"
                                  : trade.status === "lost"
                                    ? "bg-red-600 text-white"
                                    : "bg-orange-600 text-white"
                              }
                            >
                              {trade.status === "won"
                                ? "✅"
                                : trade.status === "lost"
                                  ? "❌"
                                  : "⏳"}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">
                              {trade.status === "won" && trade.payoutAmount
                                ? `+$${trade.payoutAmount}`
                                : `Entry: $${parseFloat(trade.entryPrice).toFixed(2)}`}
                            </span>
                            <span className="text-gray-500 font-mono text-xs">
                              {formatDateTime(new Date(trade.createdAt))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
