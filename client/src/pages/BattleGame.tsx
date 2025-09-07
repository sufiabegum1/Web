import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Coins,
  Clock,
  Trophy,
  Swords,
  Target,
  History
} from "lucide-react";

// Import AI-generated player images
import messiImage from '@assets/generated_images/Lionel_Messi_portrait_44eb8380.png';
import ronaldoImage from '@assets/generated_images/Cristiano_Ronaldo_portrait_a6e7917d.png';
import neymarImage from '@assets/generated_images/Neymar_Jr_portrait_00b75839.png';
import mbappeImage from '@assets/generated_images/Kylian_Mbappe_portrait_e9df5beb.png';
import deBruyneImage from '@assets/generated_images/Kevin_De_Bruyne_portrait_8dccf94e.png';
import vanDijkImage from '@assets/generated_images/Virgil_van_Dijk_portrait_ae468941.png';

interface Player {
  id: string;
  name: string;
  imageUrl: string;
  position: string;
}

interface BattleResult {
  date: string;
  playerName: string;
  betAmount: number;
  outcome: 'win' | 'lose';
  payoutAmount: number;
  timestamp: number;
}

interface DailyMatchup {
  player1: Player;
  player2: Player;
  date: string;
  player1Bets: number;
  player2Bets: number;
  winner?: Player;
}

// Famous football players with AI-generated images
const PLAYERS: Player[] = [
  { id: '1', name: 'Lionel Messi', imageUrl: messiImage, position: 'Forward' },
  { id: '2', name: 'Cristiano Ronaldo', imageUrl: ronaldoImage, position: 'Forward' },
  { id: '3', name: 'Neymar Jr', imageUrl: neymarImage, position: 'Forward' },
  { id: '4', name: 'Kylian Mbappé', imageUrl: mbappeImage, position: 'Forward' },
  { id: '5', name: 'Kevin De Bruyne', imageUrl: deBruyneImage, position: 'Midfielder' },
  { id: '6', name: 'Virgil van Dijk', imageUrl: vanDijkImage, position: 'Defender' }
];

export default function BattleGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Game state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(0.01);
  const [lastResult, setLastResult] = useState<BattleResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['/api/wallet/details'],
    enabled: !!user,
  });

  // Fetch game history
  const { data: gameHistory } = useQuery({
    queryKey: ['/api/games/history'],
    enabled: !!user,
  });

  const currentBalance = Number((walletData as any)?.balance || 0);
  const recentHistory = (gameHistory as any[])?.filter(game => game.gameType === 'battle').slice(0, 10) || [];

  // Generate daily matchup
  const todayMatchup: DailyMatchup = useMemo(() => {
    const today = new Date().toDateString();
    const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5);
    return {
      player1: shuffled[0],
      player2: shuffled[1],
      date: today,
      player1Bets: Math.floor(Math.random() * 50) + 10,
      player2Bets: Math.floor(Math.random() * 50) + 10,
    };
  }, []);

  // Get countdown to next day
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        '/api/games/battle/bet',
        {
          playerId: selectedPlayer,
          betAmount
        }
      );
      return await response.json();
    },
    onSuccess: (data: any) => {
      const selectedPlayerData = PLAYERS.find(p => p.id === selectedPlayer);
      setLastResult({
        date: new Date().toISOString(),
        playerName: selectedPlayerData?.name || 'Unknown',
        betAmount,
        outcome: data.isWin ? 'win' : 'lose',
        payoutAmount: data.isWin ? data.payout : 0,
        timestamp: Date.now()
      });
      
      // Refresh wallet balance and history
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/history'] });
      
      if (data.isWin) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "🎉 Victory!",
          description: `${selectedPlayerData?.name} won! You earned ${data.payout.toFixed(4)} USDT`,
          variant: "default",
        });
      } else {
        toast({
          title: "😔 Defeat",
          description: `${selectedPlayerData?.name} lost this battle. Better luck next time!`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsPlaying(false);
    }
  });

  const handlePlaceBet = () => {
    if (!selectedPlayer) {
      toast({
        title: "No Player Selected",
        description: "Please select a player to bet on",
        variant: "destructive",
      });
      return;
    }

    if (betAmount > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough USDT to place this bet",
        variant: "destructive",
      });
      return;
    }

    if (betAmount < 0.01) {
      toast({
        title: "Invalid Bet",
        description: "Minimum bet is 0.01 USDT",
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(true);
    placeBetMutation.mutate();
  };

  const adjustBetAmount = (type: 'half' | 'double' | 'max') => {
    if (type === 'half') {
      setBetAmount(Math.max(0.01, betAmount / 2));
    } else if (type === 'double') {
      setBetAmount(Math.min(currentBalance, betAmount * 2));
    } else if (type === 'max') {
      setBetAmount(currentBalance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center text-white pt-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Swords className="w-8 h-8 text-yellow-300" />
            Battle Arena
          </h1>
          <div className="text-lg">
            Balance: <span className="text-yellow-300 font-bold">{currentBalance.toFixed(8)}</span> USDT
          </div>
        </div>

        {/* Daily Battle Card */}
        <Card className="bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-lg border-white/30 shadow-2xl">
          <CardContent className="p-6">
            
            {/* Countdown Timer */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-yellow-300 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-semibold">BATTLE ENDS IN</span>
              </div>
              <div className="text-3xl font-bold text-white font-mono bg-black/20 rounded-lg px-4 py-2 inline-block">
                {timeLeft}
              </div>
            </div>

            {/* Players Battle */}
            <div className="relative mb-6">
              {/* VS Badge */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-2xl border-2 border-white">
                  VS
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Player 1 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPlayer(todayMatchup.player1.id)}
                  className={`w-full cursor-pointer p-6 rounded-2xl border-4 transition-all transform ${
                    selectedPlayer === todayMatchup.player1.id
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-orange-400/20 shadow-2xl shadow-yellow-400/50 scale-105'
                      : 'border-slate-600 bg-gradient-to-br from-slate-700/80 to-slate-800/80 hover:border-slate-400 hover:shadow-xl'
                  }`}
                >
                  <div className="text-center">
                    <img
                      src={todayMatchup.player1.imageUrl}
                      alt={todayMatchup.player1.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-xl"
                    />
                    <div className="text-white font-bold text-lg mb-2">
                      {todayMatchup.player1.name}
                    </div>
                    <div className="text-gray-100 text-sm font-medium bg-black/30 px-3 py-1 rounded-full inline-block">
                      {todayMatchup.player1.position}
                    </div>
                    {selectedPlayer === todayMatchup.player1.id && (
                      <div className="mt-3 text-yellow-300 font-bold">✓ SELECTED</div>
                    )}
                  </div>
                </motion.button>

                {/* Player 2 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPlayer(todayMatchup.player2.id)}
                  className={`w-full cursor-pointer p-6 rounded-2xl border-4 transition-all transform ${
                    selectedPlayer === todayMatchup.player2.id
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-orange-400/20 shadow-2xl shadow-yellow-400/50 scale-105'
                      : 'border-slate-600 bg-gradient-to-br from-slate-700/80 to-slate-800/80 hover:border-slate-400 hover:shadow-xl'
                  }`}
                >
                  <div className="text-center">
                    <img
                      src={todayMatchup.player2.imageUrl}
                      alt={todayMatchup.player2.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-xl"
                    />
                    <div className="text-white font-bold text-lg mb-2">
                      {todayMatchup.player2.name}
                    </div>
                    <div className="text-gray-100 text-sm font-medium bg-black/30 px-3 py-1 rounded-full inline-block">
                      {todayMatchup.player2.position}
                    </div>
                    {selectedPlayer === todayMatchup.player2.id && (
                      <div className="mt-3 text-yellow-300 font-bold">✓ SELECTED</div>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Bet Amount Section */}
            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur p-5 rounded-2xl border-2 border-slate-600 shadow-xl">
                <div className="text-white text-lg mb-3 font-bold">Bet Amount</div>
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6 text-yellow-400" />
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                    step="0.01"
                    min="0.01"
                    max={currentBalance}
                    className="bg-slate-900/80 border-slate-500 text-white font-mono text-xl placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                    placeholder="0.01"
                  />
                  <span className="text-white text-lg font-bold">USDT</span>
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustBetAmount('half')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-500 font-bold"
                >
                  1/2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustBetAmount('double')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-500 font-bold"
                >
                  2x
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustBetAmount('max')}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-500 font-bold"
                >
                  Max
                </Button>
              </div>

              {/* Potential Payout */}
              <div className="bg-green-500/20 backdrop-blur p-3 rounded-2xl border border-green-400/30">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-200 font-semibold">Potential Payout (2x):</span>
                  <span className="text-green-300 font-bold font-mono">
                    {(betAmount * 2).toFixed(4)} USDT
                  </span>
                </div>
              </div>
            </div>

            {/* Place Bet Button */}
            <Button
              onClick={handlePlaceBet}
              disabled={isPlaying || walletLoading || !selectedPlayer || betAmount > currentBalance}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl py-4 rounded-2xl font-bold shadow-2xl border-2 border-white/20"
            >
              {isPlaying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-2"
                >
                  <Target className="w-6 h-6" />
                  Battle in Progress...
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Enter Battle
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Display */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-8 rounded-3xl text-center backdrop-blur-lg border-4 shadow-2xl ${
                lastResult.outcome === 'win'
                  ? 'bg-gradient-to-br from-green-600/30 to-emerald-600/20 border-green-400 shadow-green-400/50'
                  : 'bg-gradient-to-br from-red-600/30 to-pink-600/20 border-red-400 shadow-red-400/50'
              }`}
            >
              <div className="text-white text-2xl font-bold mb-3">
                {lastResult.outcome === 'win' ? '🏆 Victory!' : '⚔️ Defeat'}
              </div>
              <div className="text-white text-lg mb-4 bg-black/40 px-4 py-2 rounded-xl">
                {lastResult.playerName} {lastResult.outcome === 'win' ? 'won the battle!' : 'was defeated'}
              </div>
              {lastResult.outcome === 'win' && (
                <div className="text-green-300 font-bold text-xl bg-green-900/40 px-6 py-3 rounded-xl">
                  🎉 +{lastResult.payoutAmount.toFixed(4)} USDT
                </div>
              )}
              {lastResult.outcome === 'lose' && (
                <div className="text-red-300 font-bold text-xl bg-red-900/40 px-6 py-3 rounded-xl">
                  💸 -{lastResult.betAmount.toFixed(4)} USDT
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game History */}
        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/80 backdrop-blur-lg border-slate-600 border-2 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-xl">
              <History className="w-6 h-6" />
              Recent Battles (Last 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentHistory.length === 0 ? (
              <p className="text-gray-200 text-center py-4">No battles yet. Start your first battle!</p>
            ) : (
              <div className="space-y-2">
                {recentHistory.map((game: any, index: number) => (
                  <div
                    key={game.id}
                    className={`p-3 rounded-lg border ${
                      game.result === 'win'
                        ? 'bg-green-500/20 border-green-400/30'
                        : 'bg-red-500/20 border-red-400/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-white font-semibold">
                        Battle #{recentHistory.length - index}
                      </div>
                      <div className={`font-bold ${
                        game.result === 'win' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {game.result === 'win' ? '+' : '-'}{game.amount.toFixed(4)} USDT
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border-white/20">
          <CardContent className="p-4">
            <div className="text-center text-gray-200 text-sm">
              <div className="font-bold text-white mb-2 text-lg">⚔️ How to Play</div>
              <div className="space-y-1">
                <p>• Select your champion for today's battle</p>
                <p>• Place your bet amount</p>
                <p>• Win 2x your bet if your player wins!</p>
                <p>• New battle every 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}