import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { LotteryBall } from "@/components/LotteryBall";
import { CountdownTimer } from "@/components/CountdownTimer";

export default function Results() {
  const [selectedFilter, setSelectedFilter] = useState("daily");

  const { data: completedDraws, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/draws/completed"],
    retry: false,
  });

  const { data: upcomingDraws, isLoading: upcomingLoading } = useQuery({
    queryKey: ["/api/draws/upcoming"],
    retry: false,
  });

  // Fetch specific draw data for detailed information
  const { data: dailyData } = useQuery({
    queryKey: ["/api/draw/daily"],
    retry: false,
  });

  const { data: weeklyData } = useQuery({
    queryKey: ["/api/draw/weekly"],
    retry: false,
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["/api/draw/monthly"],
    retry: false,
  });

  const filteredResults = Array.isArray(completedDraws) ? completedDraws.filter((draw: any) => 
    draw.lottery.type === selectedFilter
  ) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">🎯 Lottery Results</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Check the latest winning numbers and see if you're our next big winner!
            </p>
          </div>

          {/* Latest Results */}
          <div className="bg-white rounded-3xl p-10 mb-12 shadow-xl border border-gray-100">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold gradient-text mb-2">
                <i className="fas fa-crown mr-3"></i>
                Latest Winners
              </h3>
              <p className="text-muted-foreground">Fresh off the draw!</p>
            </div>
            
            {resultsLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading results...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {['daily', 'weekly', 'monthly'].map((type) => {
                  const latestDraw = Array.isArray(completedDraws) ? completedDraws.find((draw: any) => draw.lottery.type === type) : null;
                  
                  return (
                    <div key={type} className="relative group">
                      <div className={`absolute -inset-2 rounded-3xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity ${
                        type === 'daily' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                        type === 'weekly' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                        'bg-gradient-to-r from-purple-400 to-pink-500'
                      }`}></div>
                      <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${
                          type === 'daily' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                          type === 'weekly' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                          'bg-gradient-to-br from-purple-500 to-pink-600'
                        }`}>
                          <i className={`fas ${
                            type === 'daily' ? 'fa-sun' :
                            type === 'weekly' ? 'fa-calendar-week' :
                            'fa-calendar-alt'
                          } text-white text-3xl`}></i>
                        </div>
                        <h4 className="text-2xl font-bold gradient-text mb-4">
                          {type.charAt(0).toUpperCase() + type.slice(1)} Draw
                        </h4>
                        {latestDraw ? (
                          <>
                            <div className="text-sm text-muted-foreground mb-6 font-medium">
                              📅 {new Date(latestDraw.drawDate).toLocaleDateString()} at {new Date(latestDraw.drawDate).toLocaleTimeString()}
                            </div>
                            <div className="flex justify-center space-x-2 mb-6">
                              {latestDraw.winningNumbers?.map((num: number, idx: number) => (
                                <LotteryBall key={idx} number={num} size="md" />
                              ))}
                            </div>
                            <div className="bg-yellow-100 rounded-2xl p-4 border border-yellow-200">
                              <div className="text-sm text-muted-foreground mb-2">🏆 First Winner</div>
                              <div className="font-bold text-lg gradient-text mb-2">
                                {latestDraw.winner 
                                  ? `🎉 Ticket ${latestDraw.winner.lastName || '#UNKNOWN'} won!`
                                  : '💔 No Winner This Round'
                                }
                              </div>
                              {latestDraw.winner && (
                                <div className="text-sm text-yellow-700 font-medium">
                                  + Lots of winners! 🎊 Check your ticket list to see if you won!
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground py-8">
                            <i className="fas fa-clock text-2xl mb-4"></i>
                            <div>No recent draws available</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Draws */}
          <div className="bg-white rounded-3xl p-10 mb-12 shadow-xl border border-gray-100">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold gradient-text mb-2">
                <i className="fas fa-clock mr-3"></i>
                Next Big Draws
              </h3>
              <p className="text-muted-foreground">Don't miss your chance to win!</p>
            </div>
            
            {upcomingLoading ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-muted-foreground text-xl">Loading upcoming draws...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.isArray(upcomingDraws) && upcomingDraws.map((draw: any) => (
                  <div key={draw.id} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="grid md:grid-cols-5 gap-6 items-center">
                        <div className="flex items-center space-x-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                            draw.lottery.type === 'daily' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                            draw.lottery.type === 'weekly' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                            'bg-gradient-to-br from-purple-500 to-pink-600'
                          }`}>
                            <i className={`fas ${
                              draw.lottery.type === 'daily' ? 'fa-sun' :
                              draw.lottery.type === 'weekly' ? 'fa-calendar-week' :
                              'fa-calendar-alt'
                            } text-white text-2xl`}></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-xl text-card-foreground">{draw.lottery.name}</h4>
                            <p className="text-sm text-muted-foreground font-medium">
                              📅 {new Date(draw.drawDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="bg-yellow-100 rounded-xl p-4 border border-yellow-200">
                            <div className="text-2xl font-bold gradient-text mb-1">
                              ${parseInt(draw.lottery.prizePool).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">💰 Jackpot</div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-2 font-medium">⏰ Time Left</div>
                          <CountdownTimer targetDate={new Date(draw.drawDate)} simple />
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-2 font-medium">🎫 Ticket Price</div>
                          <div className="text-xl font-bold text-card-foreground">${draw.lottery.ticketPrice}</div>
                        </div>
                        
                        <div className="text-center">
                          <button 
                            onClick={() => window.location.href = '/buy-tickets'}
                            className={`px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                              draw.lottery.type === 'daily' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' :
                              draw.lottery.type === 'weekly' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700' :
                              'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                            }`}
                            data-testid={`button-buy-${draw.lottery.type}`}
                          >
                            <i className="fas fa-ticket-alt mr-2"></i>
                            Get Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results History */}
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold gradient-text mb-2">
                <i className="fas fa-history mr-3"></i>
                Complete Draw History
              </h3>
              <p className="text-muted-foreground">Browse all past lottery results</p>
            </div>
            
            <div className="flex justify-center gap-4 mb-10">
              {[
                { type: 'daily', icon: 'fa-sun', color: 'from-green-500 to-emerald-600' },
                { type: 'weekly', icon: 'fa-calendar-week', color: 'from-blue-500 to-cyan-600' },
                { type: 'monthly', icon: 'fa-calendar-alt', color: 'from-purple-500 to-pink-600' }
              ].map(({ type, icon, color }) => (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                    selectedFilter === type
                      ? `bg-gradient-to-r ${color} text-white shadow-xl`
                      : 'bg-gray-100 text-muted-foreground hover:text-foreground hover:shadow-lg'
                  }`}
                  data-testid={`button-filter-${type}`}
                >
                  <i className={`fas ${icon} mr-2`}></i>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {resultsLoading ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-muted-foreground text-xl">Loading results...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <i className="fas fa-search text-3xl text-white"></i>
                </div>
                <h4 className="text-2xl font-bold gradient-text mb-4">No Results Found</h4>
                <p className="text-muted-foreground text-lg">No results found for {selectedFilter} draws. Try a different lottery type!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.isArray(filteredResults) && filteredResults.map((draw: any) => (
                  <div key={draw.id} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="grid md:grid-cols-4 gap-6 items-center">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-2 font-medium">📅 Draw Date</div>
                          <div className="font-bold text-lg" data-testid={`text-draw-date-${draw.id}`}>
                            {new Date(draw.drawDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-3 font-medium">🎱 Winning Numbers</div>
                          <div className="flex justify-center space-x-2">
                            {draw.winningNumbers?.map((num: number, idx: number) => (
                              <LotteryBall key={idx} number={num} size="sm" />
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-2 font-medium">🏆 First Winner</div>
                          <div className="font-bold text-lg" data-testid={`text-winner-${draw.id}`}>
                            {draw.winner 
                              ? `Ticket ${draw.winner.lastName || '#UNKNOWN'}`
                              : 'No Winner'
                            }
                          </div>
                          {draw.winner && (
                            <div className="text-xs text-muted-foreground mt-1">
                              + More winners - check your tickets!
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-2 font-medium">🎯 Status</div>
                          <div className="font-bold text-lg text-green-600" data-testid={`text-status-${draw.id}`}>
                            {draw.winner ? 'Winner Found!' : 'No Winner'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
