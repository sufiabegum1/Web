import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { LotteryBall } from "@/components/LotteryBall";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Prize list data for each lottery type
const LOTTERY_PRIZES = {
  daily: [
    { prize: '$10,000', description: 'Grand Prize', icon: '💰' },
    { prize: '$10', description: 'Lots of Winners', icon: '🎁' },
    { prize: '$5', description: 'More Winners', icon: '🏆' }
  ],
  weekly: [
    { prize: 'R15 Motorcycle', description: '4 Winners ($5,000)', icon: '🏍️' },
    { prize: 'iPad', description: 'Limited Winners', icon: '📱' },
    { prize: '$20', description: 'Lots of Winners', icon: '🎁' },
    { prize: '$10', description: 'More Winners', icon: '🏆' }
  ],
  monthly: [
    { prize: '$50,000', description: 'Grand Prize', icon: '💎' },
    { prize: '$20,000', description: '2nd Prize', icon: '🥈' },
    { prize: 'Mystery Giftbox', description: '5 Winners ($2,000+)', icon: '🎁' },
    { prize: 'Latest iPhone', description: '10 Winners ($1,500)', icon: '📱' },
    { prize: '$50', description: 'Lots of Winners', icon: '🏆' }
  ]
};

export default function BuyTickets() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedDraw, setSelectedDraw] = useState<any>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [expandedInfoSection, setExpandedInfoSection] = useState<string | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedInfoSection) {
        setExpandedInfoSection(null);
      }
    };

    if (expandedInfoSection) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [expandedInfoSection]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to buy tickets.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: upcomingDraws, isLoading: drawsLoading } = useQuery({
    queryKey: ["/api/draws/upcoming"],
    retry: false,
  });

  const { data: dailyTicketCount } = useQuery({
    queryKey: ["/api/tickets/daily-count"],
    retry: false,
  });

  const purchaseTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await apiRequest('POST', '/api/tickets/purchase', ticketData);
      return response.json();
    },
    onSuccess: (response: any) => {
      const message = response?.message || "Ticket purchased successfully!";
      toast({
        title: "Success!",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/daily-count"] });
      setSelectedNumbers([]);
      setTicketQuantity(1);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to purchase ticket",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (Array.isArray(upcomingDraws) && upcomingDraws.length > 0 && !selectedDraw) {
      setSelectedDraw(upcomingDraws.find((draw: any) => draw.lottery.type === 'daily') || upcomingDraws[0]);
    }
  }, [upcomingDraws, selectedDraw]);

  const handleNumberSelect = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < 5) {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  const handleQuickPick = () => {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 50) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b));
  };

  const handlePurchase = () => {
    if (!selectedDraw || selectedNumbers.length !== 5) {
      toast({
        title: "Invalid Selection",
        description: "Please select exactly 5 numbers and a draw type.",
        variant: "destructive",
      });
      return;
    }

    purchaseTicketMutation.mutate({
      drawId: selectedDraw.id,
      numbers: selectedNumbers,
      quantity: ticketQuantity,
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Buy Your Lucky Tickets</span>
            </h2>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto">
              🎯 Pick your winning numbers and join millions of players competing for massive jackpots!
            </p>
          </div>


          {/* Special Bonus Information */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-8 shadow-xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-gift text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-yellow-800 mb-3">
                  🎁 Special Daily Lottery Bonus!
                </h3>
                <p className="text-yellow-700 text-lg mb-4 leading-relaxed">
                  <strong>Buy 10 Daily Lottery tickets and get 1 Monthly Lottery ticket absolutely FREE!</strong>
                </p>
                <div className="bg-white/70 rounded-2xl p-4 inline-block">
                  <p className="text-yellow-800 font-semibold">
                    💫 Every 10 daily tickets = 1 FREE Monthly Lottery ticket with huge jackpots!
                  </p>
                </div>
                
                {/* Progress Tracker */}
                {dailyTicketCount && (
                  <div className="mt-6 bg-white/50 rounded-2xl p-4">
                    <h4 className="text-yellow-800 font-semibold mb-3">Your Daily Progress Today:</h4>
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(dailyTicketCount.count % 10) * 10}%` }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-800">
                          {dailyTicketCount.count % 10}/10
                        </div>
                        <div className="text-sm text-yellow-700">
                          {dailyTicketCount.nextBonus === 10 ? 'Start collecting!' : `${dailyTicketCount.nextBonus} more to go!`}
                        </div>
                      </div>
                    </div>
                    {Math.floor(dailyTicketCount.count / 10) > 0 && (
                      <p className="text-center text-yellow-800 font-semibold mt-3">
                        🎉 You've already earned {Math.floor(dailyTicketCount.count / 10)} FREE monthly ticket(s) today!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Ticket Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-xl border border-gray-100">
                <h3 className="text-2xl lg:text-3xl font-bold mb-2">
                  <span className="gradient-text">Select Your Draw</span>
                </h3>
                <p className="text-muted-foreground mb-4 lg:mb-8 text-sm lg:text-base">Choose which lottery you'd like to enter - each offers different jackpot sizes!</p>
                
                {/* Draw Type Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
                  {Array.isArray(upcomingDraws) && upcomingDraws?.map((draw: any) => (
                    <div 
                      key={draw.id}
                      onClick={() => setSelectedDraw(draw)}
                      className={`relative group cursor-pointer transition-all duration-300 ${
                        selectedDraw?.id === draw.id 
                          ? 'transform scale-105' 
                          : 'hover:scale-102'
                      }`}
                      data-testid={`card-draw-${draw.lottery.type}`}
                    >
                      <div className={`absolute -inset-1 rounded-2xl blur-sm opacity-40 ${
                        draw.lottery.type === 'daily' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        draw.lottery.type === 'weekly' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                        'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}></div>
                      <div className={`relative border-2 rounded-xl lg:rounded-2xl p-4 lg:p-6 bg-white transition-all ${
                        selectedDraw?.id === draw.id 
                          ? 'border-transparent shadow-2xl' 
                          : 'border-gray-200 hover:border-gray-300 shadow-lg'
                      }`}>
                        <div className="text-center">
                          <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 ${
                            draw.lottery.type === 'daily' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                            draw.lottery.type === 'weekly' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                            'bg-gradient-to-br from-purple-500 to-pink-600'
                          } shadow-lg`}>
                            <i className={`fas ${
                              draw.lottery.type === 'daily' ? 'fa-sun' :
                              draw.lottery.type === 'weekly' ? 'fa-calendar-week' :
                              'fa-calendar-alt'
                            } text-white text-lg lg:text-2xl`}></i>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg lg:text-xl font-bold text-card-foreground">
                              {draw.lottery.name}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedInfoSection(
                                  expandedInfoSection === draw.lottery.type ? null : draw.lottery.type
                                );
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                draw.lottery.type === 'daily' ? 'bg-green-100 hover:bg-green-200 text-green-700' :
                                draw.lottery.type === 'weekly' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' :
                                'bg-purple-100 hover:bg-purple-200 text-purple-700'
                              }`}
                              data-testid={`button-info-${draw.lottery.type}`}
                            >
                              <i className="fas fa-info text-xs"></i>
                            </button>
                          </div>
                          <div className="mb-4">
                            <CountdownTimer targetDate={new Date(draw.drawDate)} simple />
                          </div>
                          
                          {/* Prize List - Side Scrollable */}
                          <div className="mb-4">
                            <div className="text-sm font-bold text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text mb-3 flex items-center justify-center gap-2">
                              <span className="animate-pulse">🎁</span> AMAZING PRIZES <span className="animate-pulse">🎁</span>
                            </div>
                            <div className="flex gap-2 lg:gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 pb-2 lg:pb-3" style={{ scrollbarWidth: 'thin' }}>
                              {LOTTERY_PRIZES[draw.lottery.type]?.map((prizeItem: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`group flex-shrink-0 relative min-w-[100px] lg:min-w-[140px] cursor-pointer transform hover:scale-105 lg:hover:scale-110 transition-all duration-500 ${idx === 0 ? 'prize-float' : ''}`}
                                  style={{ animationDelay: `${idx * 0.5}s` }}
                                >
                                  {/* Glowing background with enhanced effects */}
                                  <div className={`absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-2xl blur-sm opacity-40 group-hover:opacity-80 transition-opacity ${idx === 0 ? 'prize-glow' : 'animate-pulse'}`}></div>
                                  
                                  {/* Shimmer overlay */}
                                  <div className="absolute inset-0 rounded-2xl prize-card-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  
                                  {/* Main prize card */}
                                  <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 border-2 border-yellow-300 rounded-xl lg:rounded-2xl px-2 lg:px-4 py-2 lg:py-3 text-center shadow-xl group-hover:shadow-2xl transition-all overflow-hidden">
                                    {/* Sparkle animations */}
                                    <div className="absolute top-1 right-1 text-yellow-400 animate-spin">✨</div>
                                    <div className="absolute bottom-1 left-1 text-pink-400 animate-bounce" style={{ animationDelay: '0.5s' }}>💫</div>
                                    <div className="absolute top-1 left-1 text-blue-400 animate-pulse" style={{ animationDelay: '1s' }}>⭐</div>
                                    
                                    {/* Prize icon with enhanced animation */}
                                    <div className="text-xl lg:text-3xl mb-1 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>
                                      {prizeItem.icon}
                                    </div>
                                    
                                    {/* Prize amount with enhanced gradient */}
                                    <div className="text-xs lg:text-sm font-black text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text mb-1 animate-pulse">
                                      {prizeItem.prize}
                                    </div>
                                    
                                    {/* Description with enhanced styling */}
                                    <div className="text-[10px] lg:text-xs font-bold text-orange-700 leading-tight drop-shadow-sm">
                                      {prizeItem.description}
                                    </div>
                                    
                                    {/* Top prize special effects */}
                                    {idx === 0 && (
                                      <>
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-bounce font-bold border-2 border-white">
                                          🔥 TOP! 🔥
                                        </div>
                                        <div className="absolute inset-0 rounded-2xl border-2 border-gold-300 animate-pulse"></div>
                                      </>
                                    )}
                                    
                                    {/* Winner count badge */}
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
                                      WIN NOW!
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* More prizes indicator with excitement */}
                              <div className="flex-shrink-0 flex items-center justify-center min-w-[80px] lg:min-w-[120px] bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 rounded-xl lg:rounded-2xl border-2 border-dashed border-purple-400 text-purple-700 font-bold text-[10px] lg:text-xs animate-bounce shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                                <div className="text-center">
                                  <div className="text-lg lg:text-2xl mb-1 animate-spin group-hover:animate-bounce">🎯</div>
                                  <div className="animate-pulse">
                                    <div className="text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-black">+ TONS MORE</div>
                                    <div className="text-transparent bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text font-black">PRIZES! 🎊</div>
                                  </div>
                                  <div className="text-xs text-purple-500 mt-1 animate-pulse">Win Big!</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-base lg:text-lg font-bold gradient-text mb-1">
                            ${draw.lottery.ticketPrice}
                          </div>
                          <div className="text-xs lg:text-sm text-muted-foreground">per ticket</div>
                          {selectedDraw?.id === draw.id && (
                            <div className="mt-4">
                              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                <i className="fas fa-check-circle"></i>
                                Selected
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>


                {/* Number Selection */}
                <div className="mb-6 lg:mb-8">
                  <h4 className="text-xl lg:text-2xl font-bold gradient-text mb-3 lg:mb-4">🎱 Choose Your Lucky Numbers</h4>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                    <button 
                      onClick={handleQuickPick}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-sm lg:text-base"
                      data-testid="button-quick-pick"
                    >
                      <i className="fas fa-magic mr-2"></i>
                      🎲 Quick Pick (Random)
                    </button>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Or pick your own lucky numbers below</span>
                      <div className="text-sm mt-1">Choose exactly 5 numbers from 1 to 50</div>
                    </div>
                  </div>
                </div>

                {/* Number Grid */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl lg:rounded-2xl p-3 lg:p-6 mb-6 lg:mb-8 border border-gray-200">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 lg:gap-3">
                    {Array.from({length: 50}, (_, i) => i + 1).map(num => (
                      <button 
                        key={num}
                        onClick={() => handleNumberSelect(num)}
                        className={`relative w-8 h-8 lg:w-12 lg:h-12 rounded-full font-bold text-sm lg:text-lg transition-all duration-200 ${
                          selectedNumbers.includes(num)
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black shadow-xl transform scale-110 animate-bounce-gentle'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 hover:scale-105 shadow-md'
                        }`}
                        data-testid={`button-number-${num}`}
                        disabled={!selectedNumbers.includes(num) && selectedNumbers.length >= 5}
                      >
                        {num}
                        {selectedNumbers.includes(num) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-check text-white text-xs"></i>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Numbers Display */}
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl lg:rounded-2xl p-4 lg:p-6 mb-6 lg:mb-8 border border-indigo-200">
                  <h5 className="text-lg lg:text-xl font-bold text-card-foreground mb-3 lg:mb-4 text-center">
                    🎯 Your Lucky Numbers
                  </h5>
                  <div className="flex items-center justify-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                    {selectedNumbers.map((num, idx) => (
                      <div key={idx} className="relative">
                        <LotteryBall number={num} size="sm" />
                        <button
                          onClick={() => setSelectedNumbers(selectedNumbers.filter(n => n !== num))}
                          className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                          data-testid={`button-remove-${num}`}
                        >
                          <i className="fas fa-times text-white text-xs"></i>
                        </button>
                      </div>
                    ))}
                    {Array.from({length: 5 - selectedNumbers.length}).map((_, idx) => (
                      <div key={idx} className="w-8 h-8 border-3 border-dashed border-gray-400 rounded-full flex items-center justify-center text-sm text-gray-400 bg-white">
                        ?
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    {selectedNumbers.length < 5 ? (
                      <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl inline-block">
                        <i className="fas fa-arrow-up mr-2"></i>
                        <span className="font-medium">
                          Pick {5 - selectedNumbers.length} more numbers to complete your ticket
                        </span>
                      </div>
                    ) : (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl inline-block animate-pulse-slow">
                        <i className="fas fa-check-circle mr-2"></i>
                        <span className="font-bold">Perfect! Your ticket is ready 🎉</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Selection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="font-medium text-card-foreground">Number of Tickets:</label>
                    <div className="flex items-center border border-border rounded-lg">
                      <button 
                        onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                        className="px-3 py-2 hover:bg-muted transition-colors"
                        data-testid="button-quantity-decrease"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={ticketQuantity} 
                        min="1" 
                        max="10"
                        onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center py-2 border-0 focus:outline-none" 
                        data-testid="input-ticket-quantity"
                      />
                      <button 
                        onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                        className="px-3 py-2 hover:bg-muted transition-colors"
                        data-testid="button-quantity-increase"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-xl border border-gray-100 lg:sticky lg:top-24">
                <div className="text-center mb-4 lg:mb-6">
                  <h3 className="text-xl lg:text-2xl font-bold gradient-text mb-2">🛒 Order Summary</h3>
                  <p className="text-muted-foreground text-xs lg:text-sm">Review your ticket before purchase</p>
                </div>
                
                <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 lg:p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium text-sm lg:text-base">🎫 Draw Type:</span>
                      <span className="font-bold text-card-foreground text-sm lg:text-base" data-testid="text-selected-draw">
                        {selectedDraw?.lottery.name || 'None selected'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3 lg:p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium text-sm lg:text-base">💰 Price per Ticket:</span>
                      <span className="font-bold text-green-600 text-base lg:text-lg" data-testid="text-ticket-price">
                        ${selectedDraw?.lottery.ticketPrice || '0.00'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">📊 Quantity:</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                          data-testid="button-quantity-decrease"
                        >
                          <i className="fas fa-minus text-sm"></i>
                        </button>
                        <span className="font-bold text-lg w-8 text-center" data-testid="text-quantity">{ticketQuantity}</span>
                        <button 
                          onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                          data-testid="button-quantity-increase"
                        >
                          <i className="fas fa-plus text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
                      <span className="text-lg font-bold">🎯 Total Cost:</span>
                      <span className="text-2xl font-bold gradient-text" data-testid="text-total">
                        ${selectedDraw ? (parseFloat(selectedDraw.lottery.ticketPrice) * ticketQuantity).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <i className="fas fa-wallet mr-2 text-yellow-300"></i>
                      <span className="font-medium text-purple-100">Your Wallet</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-300" data-testid="text-wallet-balance">
                      ${(user as any)?.wallet?.balance || '0.00'}
                    </div>
                    <div className="text-sm text-purple-200 mt-1">Available Balance</div>
                  </div>
                </div>

                {/* Purchase Button */}
                <button 
                  onClick={handlePurchase}
                  disabled={!selectedDraw || selectedNumbers.length !== 5 || purchaseTicketMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  data-testid="button-buy-tickets"
                >
                  {purchaseTicketMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Processing Your Ticket...
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-credit-card mr-3"></i>
                      🎫 Buy My Lucky Tickets!
                    </>
                  )}
                </button>

                {/* Security Notice */}
                <div className="mt-6 bg-gray-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center text-green-600 mb-2">
                    <i className="fas fa-shield-check mr-2"></i>
                    <span className="text-sm font-bold">100% Secure & Encrypted</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bank-level security protects your transactions. Licensed & regulated lottery platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information Modal Popup */}
      {expandedInfoSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setExpandedInfoSection(null)}
          ></div>
          
          {/* Modal Content */}
          <div className={`relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br rounded-2xl shadow-2xl transform transition-all duration-300 ${
            expandedInfoSection === 'daily' ? 'from-green-50 via-emerald-50 to-green-50' :
            expandedInfoSection === 'weekly' ? 'from-blue-50 via-indigo-50 to-blue-50' :
            'from-purple-50 via-pink-50 to-purple-50'
          }`}>
            {/* Header */}
            <div className="sticky top-0 bg-white bg-opacity-90 backdrop-blur-sm p-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                    expandedInfoSection === 'daily' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    expandedInfoSection === 'weekly' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                    'bg-gradient-to-r from-purple-400 to-pink-500'
                  }`}>
                    <i className={`fas ${
                      expandedInfoSection === 'daily' ? 'fa-sun' :
                      expandedInfoSection === 'weekly' ? 'fa-calendar-week' :
                      'fa-calendar-alt'
                    } text-white text-lg`}></i>
                  </div>
                  <h3 className={`text-xl font-bold ${
                    expandedInfoSection === 'daily' ? 'text-green-700' :
                    expandedInfoSection === 'weekly' ? 'text-blue-700' :
                    'text-purple-700'
                  }`}>
                    {expandedInfoSection === 'daily' ? 'Daily Draw Information' :
                     expandedInfoSection === 'weekly' ? 'Weekly Draw Information' :
                     'Monthly Draw Information'}
                  </h3>
                </div>
                <button
                  onClick={() => setExpandedInfoSection(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  data-testid="button-close-modal"
                >
                  <i className="fas fa-times text-gray-600"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Daily Draw Information */}
              {expandedInfoSection === 'daily' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-green-600 mb-2">⏰ Every day at 9 PM EST</p>
                    <p className="text-lg font-semibold text-green-700">💵 Ticket Price: $1.00</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white bg-opacity-60 rounded-lg p-4">
                      <h4 className="font-semibold text-green-700 mb-3">🏆 Prize Structure</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">💰 Grand Prize:</span>
                          <span className="font-bold text-green-700">$10,000</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">🎁 Lots of Winners:</span>
                          <span className="font-bold text-green-700">$10 & $5</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">🍀 Winning Chance:</span>
                          <span className="font-bold text-green-700">10% per ticket</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white bg-opacity-60 rounded-lg p-4">
                      <h4 className="font-semibold text-green-700 mb-3">💡 Winning Tips</h4>
                      <div className="text-sm text-green-600 space-y-2">
                        <p>🎯 Buy 10 tickets = High chance to win!</p>
                        <p>📈 More tickets = More wins</p>
                        <p className="italic text-green-500">Prize pools increase with participation for bigger rewards</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Draw Information */}
              {expandedInfoSection === 'weekly' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-blue-600 mb-2">⏰ Every Sunday at 8 PM EST</p>
                    <p className="text-lg font-semibold text-blue-700">💵 Ticket Price: $2.00</p>
                  </div>
                  
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-700 mb-4">🏆 Prize Structure</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">🏍️ Motorcycles:</span>
                        <span className="font-bold text-blue-700">4x R15 ($5,000)</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">📱 iPads:</span>
                        <span className="font-bold text-blue-700">Limited Winners</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">🎁 Lots of Winners:</span>
                        <span className="font-bold text-blue-700">$20 & $10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-600 mb-2">🎯 More tickets gives you more winning chance</p>
                    <p className="text-xs italic text-blue-500">Prize pools increase with participation for bigger rewards</p>
                  </div>
                </div>
              )}

              {/* Monthly Draw Information */}
              {expandedInfoSection === 'monthly' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-purple-600 mb-2">⏰ Last Sunday of the month</p>
                    <p className="text-lg font-semibold text-purple-700">💵 Ticket Price: $2.50</p>
                  </div>
                  
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-purple-700 mb-4">🏆 Prize Structure</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">💎 Grand Prize:</span>
                        <span className="font-bold text-purple-700">$50,000</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">🥈 2nd Prize:</span>
                        <span className="font-bold text-purple-700">$20,000</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">🎁 Gift Boxes:</span>
                        <span className="font-bold text-purple-700">5x $2,000+</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">📱 iPhones:</span>
                        <span className="font-bold text-purple-700">10x $1,500</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">🎁 Lots of Winners:</span>
                        <span className="font-bold text-purple-700">$50</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-600 mb-2">🎯 More tickets = more winning chance</p>
                    <p className="text-xs italic text-purple-500">Prize pools increase with participation for bigger rewards</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
