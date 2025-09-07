import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Search, Clock, DollarSign, Trophy, Eye, EyeOff, Users, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface MysterySearchRound {
  id: string;
  revealedWords: Record<string, string>;
  registrationFee: string;
  prizePool: string;
  status: string;
  startTime: string;
  endTime: string;
  winnerId?: string;
  winnerSubmission?: string;
  wonAt?: string;
  nextClueRevealAt?: string;
  participantCount?: number;
}

export default function MysterySearchGame() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [nextClueIn, setNextClueIn] = useState<string>('');
  const [seedGuess, setSeedGuess] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState<string>('');

  const { data: currentRound, isLoading } = useQuery<MysterySearchRound>({
    queryKey: ['/api/mystery-search/current'],
    refetchInterval: 30000,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/mystery-search/register');
    },
    onSuccess: () => {
      toast({
        title: "Registered!",
        description: "Successfully registered for Mystery Search Game!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mystery-search/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitGuessMutation = useMutation({
    mutationFn: async (guess: string) => {
      return await apiRequest('POST', '/api/mystery-search/submit', { roundId: currentRound?.id, submission: guess });
    },
    onSuccess: (data: any) => {
      if (data.correct) {
        toast({
          title: "Congratulations! 🎉",
          description: "You found the correct seed phrase and won the game!",
        });
      } else {
        toast({
          title: "Incorrect Guess",
          description: "That's not the right seed phrase. Try again after cooldown!",
          variant: "destructive",
        });
      }
      setSeedGuess('');
      queryClient.invalidateQueries({ queryKey: ['/api/mystery-search/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!currentRound) return;

    const updateTimers = () => {
      const now = new Date().getTime();
      
      // Game end timer
      const endTime = new Date(currentRound.endTime).getTime();
      const timeDiff = endTime - now;
      
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Expired');
      }

      // Next clue timer
      if (currentRound.nextClueRevealAt) {
        const nextClueTime = new Date(currentRound.nextClueRevealAt).getTime();
        const clueDiff = nextClueTime - now;
        
        if (clueDiff > 0) {
          const clueHours = Math.floor(clueDiff / (1000 * 60 * 60));
          const clueMinutes = Math.floor((clueDiff % (1000 * 60 * 60)) / (1000 * 60));
          const clueSeconds = Math.floor((clueDiff % (1000 * 60)) / 1000);
          setNextClueIn(`${clueHours}h ${clueMinutes}m ${clueSeconds}s`);
        } else {
          setNextClueIn('Soon...');
        }
      }
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);

    return () => clearInterval(timer);
  }, [currentRound]);

  const handleRegister = () => {
    registerMutation.mutate();
  };

  const handleSubmitGuess = () => {
    if (seedGuess.trim()) {
      submitGuessMutation.mutate(seedGuess.trim());
    }
  };

  const renderWordSlots = () => {
    const slots = [];
    for (let i = 1; i <= 12; i++) {
      const word = currentRound?.revealedWords?.[i.toString()];
      slots.push(
        <motion.div 
          key={i} 
          className="flex flex-col items-center space-y-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            #{i}
          </div>
          <motion.div 
            className={`w-24 h-12 border-2 rounded-lg flex items-center justify-center text-sm font-mono transition-all duration-300 ${
              word 
                ? 'border-green-500 bg-green-50 shadow-md' 
                : 'border-dashed border-gray-300 bg-gray-50/50 hover:border-blue-400'
            }`}
            whileHover={{ scale: word ? 1.05 : 1.02 }}
          >
            {word ? (
              <motion.span 
                className="text-green-700 font-semibold px-1 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {word}
              </motion.span>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                <span className="text-xs">?</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      );
    }
    return slots;
  };

  const getRevealedCount = () => {
    return Object.keys(currentRound?.revealedWords || {}).length;
  };

  if (isLoading) {
    return (
      <Card data-testid="mystery-search-loading">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!currentRound) {
    return (
      <Card data-testid="mystery-search-inactive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Mystery Search Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              No mystery search game is currently active. 
              New rounds start automatically every few days!
            </div>
            <div className="text-sm text-muted-foreground">
              🔍 Stay tuned for the next mystery!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isRegistered = user; // You'd check if user is actually registered
  const gameEnded = currentRound.status === 'completed' || timeLeft === 'Expired';
  const hasWinner = currentRound.winnerId;

  return (
    <Card data-testid="mystery-search-active">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Mystery Search Game
          <Badge variant={gameEnded ? "secondary" : "default"} data-testid="game-status">
            {gameEnded ? (hasWinner ? 'Won' : 'Completed') : 'Active'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Find the 12-word seed phrase to win the prize pool! 
          Registration fee: ${currentRound.registrationFee}
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

        {/* Enhanced Word Slots */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Seed Phrase Progress</h3>
            </div>
            <div className="flex items-center gap-3">
              <Progress 
                value={(getRevealedCount() / 12) * 100} 
                className="w-24 h-2"
              />
              <Badge variant="outline" data-testid="revealed-count" className="font-medium">
                {getRevealedCount()}/12 words
              </Badge>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {renderWordSlots()}
            </div>
          </div>

          {currentRound?.nextClueRevealAt && !gameEnded && (
            <motion.div 
              className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium" data-testid="next-clue-timer">
                  Next clue reveals in: <strong>{nextClueIn}</strong>
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Winner Display */}
        {hasWinner && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="winner-display">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Game Won!</span>
            </div>
            <div className="text-sm text-green-700">
              Winner found the correct seed phrase and won ${currentRound.prizePool}!
            </div>
            {currentRound.winnerSubmission && (
              <div className="mt-2 p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground mb-1">Winning seed phrase:</div>
                <div className="font-mono text-sm">{currentRound.winnerSubmission}</div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Registration/Submission Area */}
        {!gameEnded && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {!isRegistered ? (
              <div className="space-y-4">
                <motion.div 
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-blue-800">Join the Hunt!</h4>
                  </div>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>🎯 Registration required to submit guesses</p>
                    <p>💰 Entry fee: <strong>${currentRound?.registrationFee}</strong></p>
                    <p>🏆 Winner takes the entire prize pool!</p>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300"
                    size="lg"
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registering...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Register Now (${currentRound?.registrationFee})
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-green-800">You're Registered!</h4>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-green-800">Submit Your Guess:</label>
                    <Textarea
                      value={seedGuess}
                      onChange={(e) => setSeedGuess(e.target.value)}
                      placeholder="Enter the 12-word seed phrase separated by spaces...\ne.g: word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                      rows={4}
                      className="font-mono text-sm border-green-300 focus:border-green-500"
                      data-testid="input-seed-phrase"
                    />
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <span>💡 Tip: Use the revealed words above as clues</span>
                    </div>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={handleSubmitGuess}
                    disabled={submitGuessMutation.isPending || !seedGuess.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300"
                    size="lg"
                    data-testid="button-submit-guess"
                  >
                    {submitGuessMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Guess...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Submit My Guess
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* Info for non-registered users watching */}
        {!isRegistered && currentRound.status === 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3" data-testid="registration-reminder">
            <div className="text-sm text-yellow-800">
              💡 Missed the current game? Register for the next game before it starts!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}