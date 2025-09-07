import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dice6, Clock, DollarSign, Lock, Unlock, Trophy, Users, Sparkles, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface TryYourLuckRound {
  id: string;
  lockAmount: string;
  prizePool: string;
  numberOfWinners: number;
  status: string;
  startTime: string;
  endTime: string;
  winnerId?: string;
  participantCount?: number;
  standardParticipants?: number;
  untilWinParticipants?: number;
}

export default function TryYourLuckGame() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [lockType, setLockType] = useState<'standard' | 'until_win'>('standard');

  const { data: currentRound, isLoading } = useQuery<TryYourLuckRound>({
    queryKey: ['/api/try-your-luck/current'],
    refetchInterval: 30000,
  });

  const joinGameMutation = useMutation({
    mutationFn: async (selectedLockType: 'standard' | 'until_win') => {
      return await apiRequest('POST', '/api/try-your-luck/join', { lockType: selectedLockType });
    },
    onSuccess: () => {
      toast({
        title: "Joined Game!",
        description: "Successfully joined Try Your Luck game!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/try-your-luck/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Join Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestUnlockMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/try-your-luck/request-unlock');
    },
    onSuccess: () => {
      toast({
        title: "Unlock Requested",
        description: "Your unlock request will be processed after the current round ends.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/try-your-luck/current'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Unlock Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!currentRound) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(currentRound.endTime).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Expired');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [currentRound]);

  const handleJoinGame = () => {
    joinGameMutation.mutate(lockType);
  };

  const handleRequestUnlock = () => {
    requestUnlockMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card data-testid="try-your-luck-loading">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!currentRound) {
    return (
      <Card data-testid="try-your-luck-inactive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dice6 className="h-5 w-5 text-primary" />
            Try Your Luck Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              No Try Your Luck game is currently active. 
              New rounds start automatically every few days!
            </div>
            <div className="text-sm text-muted-foreground">
              🎲 Good luck in the next round!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gameEnded = currentRound.status === 'completed' || timeLeft === 'Expired';
  const hasWinner = currentRound.winnerId;

  return (
    <Card data-testid="try-your-luck-active">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dice6 className="h-5 w-5 text-primary" />
          Try Your Luck Game
          <Badge variant={gameEnded ? "secondary" : "default"} data-testid="game-status">
            {gameEnded ? 'Completed' : 'Active'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Free to play! Lock ${currentRound.lockAmount} from your balance for a chance to win the prize pool.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-green-800">Prize Pool</span>
            </div>
            <div className="text-2xl font-bold text-green-600" data-testid="prize-pool">
              ${currentRound?.prizePool}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-800">Time Left</span>
            </div>
            <div className="text-xl font-bold text-blue-600" data-testid="time-left">
              {timeLeft}
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-800">Players</span>
            </div>
            <div className="text-xl font-bold text-purple-600">
              {currentRound?.participantCount || '0'}
            </div>
          </motion.div>
        </div>

        {/* Enhanced How It Works */}
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-blue-800 text-lg">How It Works</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Lock <strong>${currentRound?.lockAmount}</strong> from your balance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Choose your lock duration strategy</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Winner takes the <strong>entire prize pool</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Fair random selection process</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Winner Display */}
        {hasWinner && gameEnded && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="winner-display">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Game Won!</span>
            </div>
            <div className="text-sm text-green-700">
              Someone won ${currentRound.prizePool} in this round!
            </div>
          </div>
        )}

        {/* Game Result for Non-Winners */}
        {gameEnded && !hasWinner && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-testid="no-winner-display">
            <div className="text-center text-muted-foreground">
              Not win this time. Better luck next time!
            </div>
          </div>
        )}

        {/* Enhanced Join Game Section */}
        {!gameEnded && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Choose Your Strategy:</h3>
              </div>
              
              <RadioGroup value={lockType} onValueChange={(value) => setLockType(value as 'standard' | 'until_win')}>
                <div className="grid gap-4">
                  <motion.div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                      lockType === 'standard' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setLockType('standard')}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="standard" id="standard" data-testid="radio-standard" className="mt-1" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <Label htmlFor="standard" className="font-semibold text-green-800">
                            Standard (3 days)
                          </Label>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            Safe Choice
                          </Badge>
                        </div>
                        <div className="text-sm text-green-700">
                          💰 Money automatically unlocks after the game ends
                          <br />
                          🔄 Get full refund if you don't win
                          <br />
                          ⚡ Perfect for trying your luck once
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                      lockType === 'until_win' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setLockType('until_win')}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="until_win" id="until_win" data-testid="radio-until-win" className="mt-1" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-purple-600" />
                          <Label htmlFor="until_win" className="font-semibold text-purple-800">
                            Lock Until Win
                          </Label>
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                            High Reward
                          </Badge>
                        </div>
                        <div className="text-sm text-purple-700">
                          🔒 Money stays locked across multiple rounds
                          <br />
                          🎯 Increases your chances over time
                          <br />
                          💎 Can manually request unlock anytime
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={handleJoinGame}
                  disabled={joinGameMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300"
                  size="lg"
                  data-testid="button-join-game"
                >
                  {joinGameMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Joining Game...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Dice6 className="h-5 w-5" />
                      Lock ${currentRound?.lockAmount} & Join Game
                    </div>
                  )}
                </Button>
              </motion.div>

              <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-xs text-yellow-800 font-medium">
                  💡 By joining, ${currentRound?.lockAmount} will be temporarily locked from your balance
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Unlock Request Section for Until Win players */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              Unlock Request
            </h4>
            <div className="text-sm text-muted-foreground">
              If you have money locked with "Lock Until Win" option, you can request to unlock it.
              The unlock will take effect after the current round ends.
            </div>
            <Button 
              variant="outline"
              onClick={handleRequestUnlock}
              disabled={requestUnlockMutation.isPending}
              className="w-full"
              data-testid="button-request-unlock"
            >
              {requestUnlockMutation.isPending ? 'Requesting...' : 'Request Unlock'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}