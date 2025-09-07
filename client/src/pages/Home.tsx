import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { CountdownTimer } from "@/components/CountdownTimer";
import { LotteryBall } from "@/components/LotteryBall";
import SurpriseDraw from "@/components/SurpriseDraw";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: upcomingDraws, isLoading: drawsLoading } = useQuery({
    queryKey: ["/api/draws/upcoming"],
    retry: false,
  });

  const { data: completedDraws, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/draws/completed"],
    retry: false,
  });

  if (isLoading || drawsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated background lottery balls */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="lottery-ball-yellow w-24 h-24 rounded-full absolute top-10 left-10 animate-float opacity-20"></div>
          <div className="lottery-ball-green w-20 h-20 rounded-full absolute top-32 right-20 animate-float opacity-15" style={{animationDelay: '1s'}}></div>
          <div className="lottery-ball-purple w-16 h-16 rounded-full absolute bottom-20 left-1/3 animate-float opacity-20" style={{animationDelay: '2s'}}></div>
          <div className="lottery-ball-blue w-28 h-28 rounded-full absolute bottom-10 right-10 animate-float opacity-15" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block bg-yellow-400 text-purple-900 px-6 py-2 rounded-full text-sm font-bold mb-6 animate-bounce-gentle">
                🎉 Welcome Back, Player!
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Your <span className="text-yellow-400">Jackpot</span> Journey
              <br />
              <span className="text-3xl md:text-4xl gradient-text-white">Starts Here!</span>
            </h1>
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              🚀 Ready to win big? Pick your numbers, buy your tickets, and join the millions competing for life-changing prizes!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <button 
                onClick={() => window.location.href = '/buy-tickets'}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 px-12 py-6 rounded-2xl font-bold text-xl hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-2xl animate-shimmer"
                data-testid="button-buy-tickets"
              >
                <i className="fas fa-ticket-alt mr-3"></i>
                🎫 Buy Tickets Now
              </button>
              <button 
                onClick={() => window.location.href = '/my-tickets'}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all border border-white/30"
                data-testid="button-my-tickets"
              >
                <i className="fas fa-list mr-2"></i>
                My Tickets
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Draws Section */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">🔥 Live Draws Today</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Multiple chances to win every day! Choose your favorite draw and get your tickets now.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {Array.isArray(upcomingDraws) && upcomingDraws?.slice(0, 3).map((draw: any) => (
              <div key={draw.id} className="relative group">
                <div className={`absolute -inset-2 rounded-3xl blur-sm opacity-30 ${
                  draw.lottery.type === 'daily' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  draw.lottery.type === 'weekly' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}></div>
                <div className="relative bg-white border border-gray-200 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className={`w-16 h-16 ${
                  draw.lottery.type === 'daily' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  draw.lottery.type === 'weekly' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                  'bg-gradient-to-r from-purple-400 to-purple-600'
                } rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`fas ${
                    draw.lottery.type === 'daily' ? 'fa-sun' :
                    draw.lottery.type === 'weekly' ? 'fa-calendar-week' :
                    'fa-calendar-alt'
                  } text-white text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-2">{draw.lottery.name}</h3>
                <p className="text-muted-foreground mb-4">
                  {draw.lottery.type === 'daily' ? 'Every day at 9 PM EST' :
                   draw.lottery.type === 'weekly' ? 'Every Sunday at 8 PM EST' :
                   'Last Sunday of every month'}
                </p>
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-6 border border-yellow-200">
                    <div className="text-3xl font-bold gradient-text mb-2">
                      ${parseInt(draw.lottery.prizePool).toLocaleString()}+
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">💰 Win Upto</div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-sm font-medium text-muted-foreground mb-3">⏰ Next Draw In:</div>
                    <CountdownTimer targetDate={new Date(draw.drawDate)} />
                  </div>
                  
                  <button 
                    onClick={() => window.location.href = '/buy-tickets'}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
                      draw.lottery.type === 'daily' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' :
                      draw.lottery.type === 'weekly' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700' :
                      'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                    }`}
                    data-testid={`button-buy-${draw.lottery.type}`}
                  >
                    <i className="fas fa-ticket-alt mr-2"></i>
                    🎫 Buy Ticket - ${draw.lottery.ticketPrice}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Surprise Draw Section */}
      <section className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">🎁 Surprise Draw</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Special limited-time draws with exciting rewards! Keep watching for surprise opportunities.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <SurpriseDraw />
          </div>
        </div>
      </section>

      {/* Recent Winners Section */}
      <section className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">🏆 Recent Big Winners</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Join our hall of fame! These lucky players just changed their lives forever.
            </p>
          </div>

          {resultsLoading ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-muted-foreground text-lg">Loading winners...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(completedDraws) && completedDraws?.slice(0, 3).map((draw: any) => (
                <div key={draw.id} className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative bg-white rounded-3xl p-8 text-center shadow-xl border border-yellow-100 hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center shadow-xl">
                        <i className="fas fa-crown text-white text-3xl"></i>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                        <i className="fas fa-check text-white text-sm"></i>
                      </div>
                    </div>
                    <h3 className="font-bold text-xl text-card-foreground mb-3">
                      🎉 {draw.winner ? `Ticket ${draw.winner.lastName || '#UNKNOWN'}` : 'Jackpot Pending'}
                    </h3>
                    <div className="text-2xl font-bold text-green-600 mb-3">
                      🏆 Lucky Winner!
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {draw.lottery.name} - {new Date(draw.drawDate).toLocaleDateString()}
                    </div>
                    {draw.winningNumbers && (
                      <div className="flex justify-center space-x-1 mb-4">
                        {draw.winningNumbers.map((num: number, idx: number) => (
                          <LotteryBall key={idx} number={num} />
                        ))}
                      </div>
                    )}
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-medium">
                      <i className="fas fa-trophy mr-2"></i>
                      Winner Confirmed!
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <button 
              onClick={() => window.location.href = '/results'}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-xl"
              data-testid="button-view-all-winners"
            >
              <i className="fas fa-trophy mr-3"></i>
              🏆 View All Winners & Results
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
