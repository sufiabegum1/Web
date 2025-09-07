import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { 
  Coins, 
  Trophy, 
  Target, 
  Dice6, 
  Gamepad2,
  Gift,
  TrendingUp,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Game {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isActive: boolean;
  cooldownMinutes: number;
  minReward: string;
  maxReward: string;
}

interface GameHistory {
  id: string;
  gameId: string;
  outcome: 'win' | 'lose';
  rewardAmount: string;
  gameData: any;
  createdAt: string;
}

interface CooldownInfo {
  canPlay: boolean;
  cooldownEndsAt?: string;
}

export default function GameZone() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number}>>([]);

  // Create floating particles for gaming atmosphere
  useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2
        });
      }
      setParticles(newParticles);
    };
    createParticles();
  }, []);

  // Fetch user's game history
  const { data: gameHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/games/history'],
  });

  // Fetch user's game stats
  const { data: gameStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/games/stats'],
  });

  // Fetch wallet details for bonus balance
  const { data: wallet } = useQuery({
    queryKey: ['/api/wallet/details'],
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs for atmosphere */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 opacity-10 blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 opacity-10 blur-xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 opacity-10 blur-xl animate-pulse"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-black text-white mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent relative"
            animate={{
              textShadow: [
                "0 0 20px rgba(255, 215, 0, 0.5)",
                "0 0 30px rgba(255, 165, 0, 0.7)",
                "0 0 20px rgba(255, 215, 0, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="relative">
              🎮 GAME ZONE 🎮
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent opacity-50"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-2xl text-cyan-300 mb-6 font-semibold tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            🚀 Play Epic Games & Win USDT Rewards! 💎
          </motion.p>
          
          {/* Enhanced Bonus Balance Display */}
          <motion.div 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-8 py-4 rounded-full text-white font-bold text-xl shadow-2xl border-2 border-green-400/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Coins className="w-8 h-8 text-yellow-300" />
            </motion.div>
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
              Bonus Balance: ${(wallet as any)?.bonusBalance || '0.00'}
            </span>
          </motion.div>
        </motion.div>

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur">
            <TabsTrigger value="games" className="data-[state=active]:bg-white/20">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white/20">
              <Trophy className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-white/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-6">
            {/* Featured Games - Enhanced with Amazing Animations */}
            <div className="grid md:grid-cols-1 gap-8 mb-12">
              {/* Battle Arena Card - Ultra Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard('battle')}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-xl border-2 border-purple-400/40 hover:border-purple-400/80 text-white h-full shadow-2xl group">
                  {/* Animated Background Gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                    animate={hoveredCard === 'battle' ? {
                      background: [
                        'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
                        'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(147, 51, 234, 0.3))',
                        'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* Glowing Border Effect */}
                  {hoveredCard === 'battle' && (
                    <motion.div
                      className="absolute inset-0 rounded-lg border-2 border-purple-400/60"
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(147, 51, 234, 0.3)',
                          '0 0 40px rgba(236, 72, 153, 0.5)',
                          '0 0 20px rgba(147, 51, 234, 0.3)'
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}

                  <CardContent className="relative p-8 text-center">
                    <motion.div
                      className="text-8xl mb-6 filter drop-shadow-2xl"
                      animate={hoveredCard === 'battle' ? {
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.2, 1],
                        filter: ['drop-shadow(0 0 10px rgba(147, 51, 234, 0.5))', 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))', 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.5))']
                      } : {}}
                      transition={{ duration: 0.8 }}
                    >
                      ⚔️
                    </motion.div>

                    <motion.h3 
                      className="text-3xl font-black mb-3 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"
                      animate={hoveredCard === 'battle' ? { scale: 1.1 } : { scale: 1 }}
                    >
                      BATTLE ARENA
                    </motion.h3>

                    <p className="text-purple-200 mb-6 text-lg leading-relaxed">
                      ⚡ Daily football player battles! Bet on your champion and win 2× if underdog wins!
                    </p>

                    <Link href="/battle-game" data-testid="link-battle-game">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg border-2 border-purple-400/30 hover:border-purple-400/60 transition-all duration-300">
                          <motion.div
                            className="flex items-center justify-center gap-3"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Play className="w-6 h-6" />
                            ENTER BATTLE ARENA
                          </motion.div>
                        </Button>
                      </motion.div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* NEW GAMES SECTION */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Mystery Search Game Card */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard('mystery')}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600/30 to-cyan-600/30 backdrop-blur-xl border-2 border-blue-400/40 hover:border-blue-400/80 text-white h-full shadow-2xl group">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                    animate={hoveredCard === 'mystery' ? {
                      background: [
                        'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(34, 211, 238, 0.2))',
                        'linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(59, 130, 246, 0.3))',
                        'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(34, 211, 238, 0.2))'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {hoveredCard === 'mystery' && (
                    <motion.div
                      className="absolute inset-0 rounded-lg border-2 border-blue-400/60"
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(59, 130, 246, 0.3)',
                          '0 0 40px rgba(34, 211, 238, 0.5)',
                          '0 0 20px rgba(59, 130, 246, 0.3)'
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}

                  <CardContent className="relative p-8 text-center">
                    <motion.div
                      className="text-8xl mb-6 filter drop-shadow-2xl"
                      animate={hoveredCard === 'mystery' ? {
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.2, 1],
                        filter: ['drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))', 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))', 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))']
                      } : {}}
                      transition={{ duration: 0.8 }}
                    >
                      🔍
                    </motion.div>

                    <motion.h3 
                      className="text-3xl font-black mb-3 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent"
                      animate={hoveredCard === 'mystery' ? { scale: 1.1 } : { scale: 1 }}
                    >
                      MYSTERY SEARCH
                    </motion.h3>

                    <p className="text-blue-200 mb-6 text-lg leading-relaxed">
                      🧩 Find the 12-word seed phrase! Clues revealed over 3 days. Winner takes all!
                    </p>

                    <div className="bg-blue-900/30 backdrop-blur rounded-lg p-4 mb-6">
                      <div className="text-sm text-blue-200">
                        Registration: $1.00 • Duration: 3 Days • Progressive Clues
                      </div>
                    </div>

                    <Link href="/mystery-search" data-testid="link-mystery-search">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg border-2 border-blue-400/30 hover:border-blue-400/60 transition-all duration-300">
                          <motion.div
                            className="flex items-center justify-center gap-3"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Play className="w-6 h-6" />
                            START MYSTERY SEARCH
                          </motion.div>
                        </Button>
                      </motion.div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Try Your Luck Game Card */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard('luck')}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card className="relative overflow-hidden bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-xl border-2 border-green-400/40 hover:border-green-400/80 text-white h-full shadow-2xl group">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                    animate={hoveredCard === 'luck' ? {
                      background: [
                        'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                        'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(34, 197, 94, 0.3))',
                        'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {hoveredCard === 'luck' && (
                    <motion.div
                      className="absolute inset-0 rounded-lg border-2 border-green-400/60"
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(34, 197, 94, 0.3)',
                          '0 0 40px rgba(16, 185, 129, 0.5)',
                          '0 0 20px rgba(34, 197, 94, 0.3)'
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}

                  <CardContent className="relative p-8 text-center">
                    <motion.div
                      className="text-8xl mb-6 filter drop-shadow-2xl"
                      animate={hoveredCard === 'luck' ? {
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.2, 1],
                        filter: ['drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))', 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.8))', 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))']
                      } : {}}
                      transition={{ duration: 0.8 }}
                    >
                      🎲
                    </motion.div>

                    <motion.h3 
                      className="text-3xl font-black mb-3 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent"
                      animate={hoveredCard === 'luck' ? { scale: 1.1 } : { scale: 1 }}
                    >
                      TRY YOUR LUCK
                    </motion.h3>

                    <p className="text-green-200 mb-6 text-lg leading-relaxed">
                      🍀 Free to play! Lock $1 and hope to win the prize pool. Choose your lock duration!
                    </p>

                    <div className="bg-green-900/30 backdrop-blur rounded-lg p-4 mb-6">
                      <div className="text-sm text-green-200">
                        Lock Amount: $1.00 • Free to Play • Winner Takes All
                      </div>
                    </div>

                    <Link href="/try-your-luck" data-testid="link-try-your-luck">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg border-2 border-green-400/30 hover:border-green-400/60 transition-all duration-300">
                          <motion.div
                            className="flex items-center justify-center gap-3"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Play className="w-6 h-6" />
                            TRY YOUR LUCK NOW
                          </motion.div>
                        </Button>
                      </motion.div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Enhanced Promotional Section */}
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="max-w-4xl mx-auto">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-8"
                >
                  <Gamepad2 className="w-20 h-20 text-yellow-400 mx-auto mb-6 filter drop-shadow-lg" />
                </motion.div>
                
                <motion.h3 
                  className="text-4xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🎮 ULTIMATE GAMING EXPERIENCE 🎮
                </motion.h3>
                
                <p className="text-2xl text-cyan-300 mb-8 font-semibold">
                  🚀 Choose Your Adventure & Win Big! 💰
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 text-lg">
                  <motion.div 
                    className="flex items-center justify-center gap-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 p-6 rounded-2xl border border-red-400/30"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <motion.span 
                      className="text-4xl"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      🎲
                    </motion.span>
                    <div className="text-left">
                      <h4 className="font-bold text-orange-300">Dice Game</h4>
                      <p className="text-orange-200 text-sm">Strategic betting • 1% house edge • Instant rewards</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center justify-center gap-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-2xl border border-purple-400/30"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                  >
                    <motion.span 
                      className="text-4xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, -10, 10, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ⚔️
                    </motion.span>
                    <div className="text-left">
                      <h4 className="font-bold text-purple-300">Battle Arena</h4>
                      <p className="text-purple-200 text-sm">Daily tournaments • 2× underdog wins • Epic battles</p>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div 
                  className="mt-8 p-6 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-teal-600/20 rounded-2xl border border-green-400/30"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(34, 197, 94, 0.2)',
                      '0 0 40px rgba(34, 197, 94, 0.4)',
                      '0 0 20px rgba(34, 197, 94, 0.2)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Coins className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                    <span className="text-2xl font-bold text-green-300">BONUS REWARDS SYSTEM</span>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Coins className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                  </div>
                  <p className="text-green-200 text-lg">
                    💎 Every game you play earns bonus credits! 🎯 Fair play guaranteed! ⚡ Instant USDT payouts!
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Recent Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4" />
                    <p className="text-blue-200">Loading history...</p>
                  </div>
                ) : (gameHistory as any[]).length === 0 ? (
                  <div className="text-center py-8">
                    <Dice6 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-200">No games played yet. Start playing to see your history!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(gameHistory as GameHistory[]).map((record: GameHistory) => {
                      return (
                        <div
                          key={record.id}
                          data-testid={`history-${record.id}`}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🎮</div>
                            <div>
                              <p className="font-semibold">Game</p>
                              <p className="text-sm text-blue-300">{formatTimeAgo(record.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge
                              variant={record.outcome === 'win' ? 'default' : 'secondary'}
                              className={
                                record.outcome === 'win'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-600 text-gray-200'
                              }
                            >
                              {record.outcome === 'win' ? '✅ Won' : '❌ Lost'}
                            </Badge>
                            {record.outcome === 'win' && (
                              <p className="text-green-400 font-bold mt-1">
                                +${record.rewardAmount}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4" />
                  <p className="text-blue-200">Loading stats...</p>
                </div>
              ) : (
                <>
                  <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur border-white/20 text-white">
                    <CardContent className="pt-6 text-center">
                      <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{(gameStats as any)?.totalGames || 0}</p>
                      <p className="text-blue-200">Games Played</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur border-white/20 text-white">
                    <CardContent className="pt-6 text-center">
                      <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{(gameStats as any)?.totalWins || 0}</p>
                      <p className="text-green-200">Total Wins</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur border-white/20 text-white">
                    <CardContent className="pt-6 text-center">
                      <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold">${(gameStats as any)?.totalRewards?.toFixed(2) || '0.00'}</p>
                      <p className="text-yellow-200">Total Rewards</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur border-white/20 text-white">
                    <CardContent className="pt-6 text-center">
                      <Gamepad2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{(gameStats as any)?.winRate?.toFixed(1) || '0.0'}%</p>
                      <p className="text-purple-200">Win Rate</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Game Breakdown */}
            {(gameStats as any)?.gameBreakdown && Object.keys((gameStats as any).gameBreakdown).length > 0 && (
              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-pink-400" />
                    Game Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries((gameStats as any).gameBreakdown).map(([gameName, stats]: [string, any]) => (
                      <div
                        key={gameName}
                        data-testid={`game-stats-${gameName}`}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">{gameName}</p>
                          <p className="text-sm text-blue-300">
                            {stats.plays} games • {stats.wins} wins • {((stats.wins/stats.plays)*100).toFixed(1)}% win rate
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">${stats.rewards.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}