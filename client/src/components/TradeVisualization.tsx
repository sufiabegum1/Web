import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Target, Timer } from 'lucide-react';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradeVisualizationProps {
  trade: {
    id: string;
    direction: 'up' | 'down';
    entryPrice: string;
    stakeAmount: string;
    expiryTime: Date;
    instrument: {
      symbol: string;
    };
  };
  currentPrice: number;
  isActive: boolean;
  onTradeComplete: () => void;
}

export default function TradeVisualization({ 
  trade, 
  currentPrice, 
  isActive, 
  onTradeComplete 
}: TradeVisualizationProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const entryPrice = parseFloat(trade.entryPrice);
  const isWinning = trade.direction === 'up' ? currentPrice > entryPrice : currentPrice < entryPrice;
  const priceDifference = ((currentPrice - entryPrice) / entryPrice) * 100;

  // Generate realistic candlestick data
  useEffect(() => {
    const generateCandleData = () => {
      const data: CandleData[] = [];
      const now = Date.now();
      const basePrice = entryPrice;
      let lastClose = basePrice;
      
      // Generate 30 historical candles (30 seconds ago)
      for (let i = 29; i >= 0; i--) {
        const timestamp = now - (i * 1000); // 1 second per candle
        
        // Simulate realistic price movement
        const volatility = basePrice * 0.001; // 0.1% volatility
        const trend = trade.direction === 'up' ? 0.0002 : -0.0002; // Small trend
        const randomMovement = (Math.random() - 0.5) * volatility * 2;
        
        const open = lastClose;
        const change = trend + randomMovement;
        const close = open + change;
        
        // High and low based on the candle's movement
        const candleRange = Math.abs(close - open) + volatility * 0.5;
        const high = Math.max(open, close) + (Math.random() * candleRange * 0.5);
        const low = Math.min(open, close) - (Math.random() * candleRange * 0.5);
        
        const volume = 1000 + Math.random() * 2000; // Random volume
        
        data.push({ timestamp, open, high, low, close, volume });
        lastClose = close;
      }
      
      setCandleData(data);
    };

    generateCandleData();
    const interval = setInterval(generateCandleData, 1000); // Update every second
    return () => clearInterval(interval);
  }, [entryPrice, trade.direction]);

  // Calculate time remaining
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(trade.expiryTime).getTime();
      const remaining = Math.max(0, expiry - now);
      const totalDuration = 60 * 1000; // 1 minute in milliseconds
      
      setTimeRemaining(remaining);
      setAnimationProgress(1 - (remaining / totalDuration));

      if (remaining === 0 && isActive) {
        onTradeComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [trade.expiryTime, isActive, onTradeComplete]);

  // Professional Trading Chart Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candleData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Set canvas size
      canvas.width = canvas.offsetWidth || 600;
      canvas.height = canvas.offsetHeight || 400;
      
      const width = canvas.width;
      const height = canvas.height;
      const chartHeight = height * 0.7; // 70% for price, 30% for volume
      const volumeHeight = height * 0.3;
      
      // Clear canvas with premium gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0e12');
      bgGradient.addColorStop(0.4, '#0c1016');
      bgGradient.addColorStop(1, '#06090c');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Get price range
      const prices = candleData.flatMap(d => [d.high, d.low]);
      const maxPrice = Math.max(...prices, currentPrice);
      const minPrice = Math.min(...prices, currentPrice);
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;
      const chartMinPrice = minPrice - padding;
      const chartMaxPrice = maxPrice + padding;
      const chartPriceRange = chartMaxPrice - chartMinPrice;
      
      // Helper functions
      const priceToY = (price: number) => chartHeight - ((price - chartMinPrice) / chartPriceRange) * chartHeight;
      const indexToX = (index: number) => (index / (candleData.length - 1)) * width;
      
      // Draw sophisticated grid lines with subtle glow
      const gridGradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
      gridGradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      gridGradient.addColorStop(0.5, 'rgba(75, 85, 99, 0.1)');
      gridGradient.addColorStop(1, 'rgba(99, 102, 241, 0.12)');
      
      ctx.strokeStyle = gridGradient;
      ctx.lineWidth = 0.8;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 1;
      
      // Horizontal grid lines (price levels)
      for (let i = 0; i <= 8; i++) {
        const price = chartMinPrice + (chartPriceRange * i / 8);
        const y = priceToY(price);
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        // Professional price labels with glow effect
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 11px "SF Mono", "Monaco", "Cascadia Code", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`$${price.toFixed(2)}`, width - 8, y - 4);
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }
      
      // Vertical grid lines (time)
      for (let i = 0; i <= 6; i++) {
        const x = (i / 6) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw candlesticks
      const candleWidth = Math.max(2, width / candleData.length * 0.8);
      
      candleData.forEach((candle, index) => {
        const x = indexToX(index);
        const openY = priceToY(candle.open);
        const closeY = priceToY(candle.close);
        const highY = priceToY(candle.high);
        const lowY = priceToY(candle.low);
        
        const isGreen = candle.close >= candle.open;
        
        // Calculate body dimensions first
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY) || 1;
        
        // Professional candlestick colors with gradients
        const greenGradient = ctx.createLinearGradient(x - candleWidth/2, bodyTop, x + candleWidth/2, bodyTop + bodyHeight);
        greenGradient.addColorStop(0, '#10b981');
        greenGradient.addColorStop(1, '#059669');
        
        const redGradient = ctx.createLinearGradient(x - candleWidth/2, bodyTop, x + candleWidth/2, bodyTop + bodyHeight);
        redGradient.addColorStop(0, '#f87171');
        redGradient.addColorStop(1, '#dc2626');
        
        ctx.strokeStyle = isGreen ? '#10b981' : '#f87171';
        ctx.fillStyle = isGreen ? greenGradient : redGradient;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = isGreen ? '#10b981' : '#f87171';
        ctx.shadowBlur = 2;
        
        // High-low line (wick)
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        
        if (isGreen) {
          ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
        } else {
          ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
        }
        
        // Volume bars at bottom
        const maxVolume = Math.max(...candleData.map(d => d.volume));
        const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
        const volumeY = chartHeight + (volumeHeight - volumeBarHeight);
        
        ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
        ctx.fillRect(x - candleWidth/2, volumeY, candleWidth, volumeBarHeight);
      });
      
      // Draw professional moving averages with glow
      if (candleData.length > 10) {
        // 10-period MA with premium styling
        const maGradient = ctx.createLinearGradient(0, 0, width, 0);
        maGradient.addColorStop(0, '#fbbf24');
        maGradient.addColorStop(0.5, '#f59e0b');
        maGradient.addColorStop(1, '#d97706');
        
        ctx.strokeStyle = maGradient;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        
        for (let i = 9; i < candleData.length; i++) {
          const ma = candleData.slice(i - 9, i + 1).reduce((sum, c) => sum + c.close, 0) / 10;
          const x = indexToX(i);
          const y = priceToY(ma);
          
          if (i === 9) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      
      // Draw entry price line
      const entryY = priceToY(entryPrice);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(width, entryY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Professional entry price label with glow
      const entryLabelGradient = ctx.createLinearGradient(0, entryY - 8, 0, entryY + 8);
      entryLabelGradient.addColorStop(0, '#fbbf24');
      entryLabelGradient.addColorStop(1, '#f59e0b');
      
      ctx.fillStyle = entryLabelGradient;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fillRect(0, entryY - 10, 80, 20);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 11px "SF Mono", "Monaco", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ENTRY $${entryPrice.toFixed(2)}`, 4, entryY + 2);
      
      // Draw current price line
      const currentY = priceToY(currentPrice);
      ctx.strokeStyle = isWinning ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width, currentY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Professional current price label with dynamic glow
      const currentLabelGradient = ctx.createLinearGradient(width - 90, currentY - 10, width, currentY + 10);
      if (isWinning) {
        currentLabelGradient.addColorStop(0, '#10b981');
        currentLabelGradient.addColorStop(1, '#059669');
      } else {
        currentLabelGradient.addColorStop(0, '#f87171');
        currentLabelGradient.addColorStop(1, '#dc2626');
      }
      
      ctx.fillStyle = currentLabelGradient;
      ctx.shadowColor = isWinning ? '#10b981' : '#f87171';
      ctx.shadowBlur = 12;
      ctx.fillRect(width - 90, currentY - 10, 90, 20);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "SF Mono", "Monaco", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`LIVE $${currentPrice.toFixed(2)}`, width - 86, currentY + 2);
      
      // Draw support/resistance levels
      const supportLevel = minPrice + (priceRange * 0.2);
      const resistanceLevel = maxPrice - (priceRange * 0.2);
      
      // Support line
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, priceToY(supportLevel));
      ctx.lineTo(width, priceToY(supportLevel));
      ctx.stroke();
      
      // Resistance line  
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, priceToY(resistanceLevel));
      ctx.lineTo(width, priceToY(resistanceLevel));
      ctx.stroke();
      ctx.setLineDash([]);
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [candleData, currentPrice, entryPrice, isWinning, animationProgress]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="relative bg-gradient-to-b from-[#0d1117] to-[#0a0e14] rounded-xl border border-[#21262d] shadow-2xl overflow-hidden">
      {/* Premium Trading Header */}
      <div className="bg-gradient-to-r from-[#161b22] to-[#1c2128] border-b border-[#30363d] px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full shadow-lg ${
                trade.direction === 'up' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
              } animate-pulse`} />
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-xl tracking-wide">{trade.instrument.symbol}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  trade.direction === 'up' 
                    ? 'bg-gradient-to-r from-emerald-900/60 to-green-900/60 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-gradient-to-r from-rose-900/60 to-red-900/60 text-rose-300 border border-rose-500/30'
                }`}>
                  {trade.direction === 'up' ? 'CALL' : 'PUT'}
                </span>
              </div>
            </div>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Live • Binary Options</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg backdrop-blur-sm border ${
              isWinning 
                ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20 shadow-lg' 
                : 'bg-rose-900/30 border-rose-500/40 text-rose-300 shadow-rose-500/20 shadow-lg'
            }`}>
              {isWinning ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-bold text-lg tracking-wide">
                {priceDifference >= 0 ? '+' : ''}{priceDifference.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-3 text-amber-400 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg">
              <Timer className="w-5 h-5" />
              <span className="font-mono font-bold text-lg tracking-wider">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Stats Bar */}
      <div className="bg-gradient-to-r from-[#0c1016] to-[#10141a] border-b border-[#21262d] px-6 py-4">
        <div className="grid grid-cols-5 gap-8">
          <div className="flex flex-col items-start">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Entry Price</div>
            <div className="text-base font-mono font-bold text-amber-400 tracking-wide">
              ${entryPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Live Price</div>
            <div className={`text-base font-mono font-bold tracking-wide ${
              isWinning ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              ${currentPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Price Move</div>
            <div className={`text-base font-mono font-bold tracking-wide flex items-center gap-2 ${
              isWinning ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isWinning ? '↗' : '↘'} ${Math.abs(currentPrice - entryPrice).toFixed(2)}
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Investment</div>
            <div className="text-base font-mono font-bold text-sky-400 tracking-wide">
              ${trade.stakeAmount}
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Potential Return</div>
            <div className="text-base font-mono font-bold text-violet-400 tracking-wide">
              ${(parseFloat(trade.stakeAmount) * 1.8).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Chart Container */}
      <div className="relative bg-gradient-to-b from-[#0a0e12] to-[#06090c] border-b border-[#21262d]">
        <canvas 
          ref={canvasRef}
          className="w-full h-[400px] cursor-crosshair"
          style={{ maxWidth: '100%', height: '400px' }}
          data-testid="trading-chart-canvas"
        />
        
        {/* Chart Overlay - Trade Status */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md backdrop-blur-sm border ${
            isWinning 
              ? 'bg-green-900/30 border-green-700/50 text-green-300' 
              : 'bg-red-900/30 border-red-700/50 text-red-300'
          }`}>
            {isWinning ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-medium">
              {isWinning ? 'IN THE MONEY' : 'OUT OF THE MONEY'}
            </span>
          </div>
        </div>

        {/* Chart Tools Overlay */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <div className="bg-black/50 backdrop-blur-sm border border-gray-700/50 rounded px-2 py-1">
            <div className="text-xs text-gray-400">Volume</div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm border border-gray-700/50 rounded px-2 py-1">
            <div className="text-xs text-gray-400">MA(10)</div>
          </div>
        </div>

        {/* Progress Timer Bar */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-gray-800/50 rounded-full h-1.5 backdrop-blur-sm border border-gray-700/50">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isWinning ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{ width: `${animationProgress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Trade Active</span>
            <span>{formatTime(timeRemaining)} remaining</span>
          </div>
        </div>
      </div>

      {/* Premium Footer */}
      <div className="bg-gradient-to-r from-[#161b22] to-[#1c2128] border-t border-[#30363d] px-6 py-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              Trade ID: <span className="text-gray-300 font-mono">{trade.id.slice(0, 8)}...</span>
            </span>
            <span className="text-gray-500">
              Type: <span className="text-gray-300">Binary Options</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              Expiry: <span className="text-gray-300 font-mono">
                {new Date(trade.expiryTime).toLocaleTimeString([], {hour12: false})}
              </span>
            </span>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isActive ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'
            }`}>
              {isActive ? 'ACTIVE' : 'EXPIRED'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}