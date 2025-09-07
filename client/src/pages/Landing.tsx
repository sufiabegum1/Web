import { Navigation } from "@/components/Navigation";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative hero-gradient overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating lottery balls animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="lottery-ball-purple w-16 h-16 rounded-full absolute top-20 left-10 animate-float opacity-20" style={{animationDelay: '0s'}}></div>
          <div className="lottery-ball-blue w-12 h-12 rounded-full absolute top-40 right-20 animate-float opacity-30" style={{animationDelay: '1s'}}></div>
          <div className="lottery-ball-yellow w-20 h-20 rounded-full absolute bottom-20 left-20 animate-float opacity-25" style={{animationDelay: '2s'}}></div>
          <div className="lottery-ball-green w-14 h-14 rounded-full absolute bottom-40 right-10 animate-float opacity-30" style={{animationDelay: '0.5s'}}></div>
          <div className="lottery-ball-red w-10 h-10 rounded-full absolute top-60 left-1/2 animate-float opacity-20" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <span className="inline-block bg-white/20 glass-effect text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  🎉 #1 Lottery Platform
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Win <span className="gradient-text">Massive</span>
                <br />Prizes Today!
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Experience the thrill of winning with our secure, transparent lottery system. 
                <strong>Daily draws start at $1,000!</strong>
              </p>
              
              {/* Prize showcase */}
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto lg:mx-0">
                <div className="glass-effect rounded-lg p-3 text-center">
                  <div className="text-yellow-300 font-bold text-lg">$1K+</div>
                  <div className="text-white/80 text-xs">Daily</div>
                </div>
                <div className="glass-effect rounded-lg p-3 text-center">
                  <div className="text-yellow-300 font-bold text-lg">$10K+</div>
                  <div className="text-white/80 text-xs">Weekly</div>
                </div>
                <div className="glass-effect rounded-lg p-3 text-center">
                  <div className="text-yellow-300 font-bold text-lg">$100K+</div>
                  <div className="text-white/80 text-xs">Monthly</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-yellow-400 text-purple-900 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-2xl animate-shimmer relative overflow-hidden"
                  data-testid="button-get-started"
                >
                  <i className="fas fa-rocket mr-3"></i>
                  Start Winning Now
                </button>
                <button 
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="glass-effect text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all border border-white/30"
                  data-testid="button-how-it-works"
                >
                  <i className="fas fa-play mr-3"></i>
                  See How it Works
                </button>
              </div>
            </div>
            
            <div className="flex justify-center relative">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-30 animate-pulse-slow"></div>
                <div className="relative bg-white/10 glass-effect rounded-3xl p-8">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="lottery-ball-purple w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl animate-bounce-gentle">7</div>
                    <div className="lottery-ball-blue w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl animate-bounce-gentle" style={{animationDelay: '0.2s'}}>21</div>
                    <div className="lottery-ball-yellow w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl animate-bounce-gentle" style={{animationDelay: '0.4s'}}>35</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="lottery-ball-green w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl animate-bounce-gentle mx-auto" style={{animationDelay: '0.6s'}}>42</div>
                    <div className="lottery-ball-red w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl animate-bounce-gentle mx-auto" style={{animationDelay: '0.8s'}}>56</div>
                  </div>
                  <div className="text-center mt-6">
                    <div className="text-white text-lg font-bold">Latest Winning Numbers</div>
                    <div className="text-white/70">Prize: $50,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Join the excitement in just 4 simple steps! Our platform makes winning easier than ever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-xl">
                  <i className="fas fa-user-plus text-white text-3xl"></i>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 group-hover:shadow-2xl transition-all">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">1</div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3">Sign Up Free</h3>
                  <p className="text-muted-foreground">
                    Create your account in seconds with email or social login. No fees, no hassle!
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-xl">
                  <i className="fas fa-wallet text-white text-3xl"></i>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 group-hover:shadow-2xl transition-all">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">2</div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3">Add Credits</h3>
                  <p className="text-muted-foreground">
                    Load your wallet securely. Start playing with just $5 and get bonus credits!
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-xl">
                  <i className="fas fa-ticket-alt text-white text-3xl"></i>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-100 group-hover:shadow-2xl transition-all">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">3</div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3">Buy Tickets</h3>
                  <p className="text-muted-foreground">
                    Pick your lucky numbers or use Quick Pick. Tickets start from just $2!
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-xl winning-glow">
                  <i className="fas fa-trophy text-white text-3xl"></i>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 group-hover:shadow-2xl transition-all">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">4</div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3">Win Big!</h3>
                  <p className="text-muted-foreground">
                    Watch live draws and celebrate your wins. Instant payouts to your wallet!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Stats */}
          <div className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center">
            <h3 className="text-3xl font-bold mb-8">🔥 Live Platform Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300 animate-pulse-slow">1,247,593</div>
                <div className="text-sm opacity-90">Total Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300 animate-pulse-slow">$2.8M</div>
                <div className="text-sm opacity-90">Won This Month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 animate-pulse-slow">847</div>
                <div className="text-sm opacity-90">Winners Today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-300 animate-pulse-slow">$156K</div>
                <div className="text-sm opacity-90">Next Jackpot</div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <h3 className="text-3xl font-bold text-center mb-4">
              <span className="gradient-text">Why Choose LuckyDraw?</span>
            </h3>
            <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
              Join millions of satisfied players who trust our platform for fair, secure, and exciting lottery experiences.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <i className="fas fa-shield-alt text-white text-3xl"></i>
                </div>
                <h4 className="text-xl font-bold text-card-foreground mb-4">100% Secure & Fair</h4>
                <p className="text-muted-foreground leading-relaxed">Bank-level encryption and transparent random number generation. Regulated and audited by industry experts.</p>
              </div>
              <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <i className="fas fa-bolt text-white text-3xl"></i>
                </div>
                <h4 className="text-xl font-bold text-card-foreground mb-4">Instant Payouts</h4>
                <p className="text-muted-foreground leading-relaxed">Winners receive prizes immediately after draw results. No waiting, no hassle - just instant wins!</p>
              </div>
              <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <i className="fas fa-mobile-alt text-white text-3xl"></i>
                </div>
                <h4 className="text-xl font-bold text-card-foreground mb-4">Play Anywhere</h4>
                <p className="text-muted-foreground leading-relaxed">Optimized for all devices. Buy tickets, check results, and manage your account from anywhere.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="lottery-ball-yellow w-32 h-32 rounded-full absolute -top-16 -left-16 animate-float opacity-10"></div>
          <div className="lottery-ball-purple w-24 h-24 rounded-full absolute top-20 right-10 animate-float opacity-15" style={{animationDelay: '1s'}}></div>
          <div className="lottery-ball-green w-20 h-20 rounded-full absolute bottom-10 left-10 animate-float opacity-10" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="inline-block bg-yellow-400 text-purple-900 px-6 py-2 rounded-full text-sm font-bold mb-6 animate-bounce-gentle">
              🎯 Limited Time: 2X Bonus Credits!
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your <span className="text-yellow-400">Jackpot</span> Awaits!
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Don't wait another day to change your life. Join over 1 million players and start your winning journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 px-12 py-6 rounded-2xl font-bold text-xl hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-2xl animate-shimmer relative overflow-hidden"
              data-testid="button-join-now"
            >
              <i className="fas fa-crown mr-3"></i>
              Start Winning Now - FREE!
            </button>
            <div className="text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-green-400"></i>
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <i className="fas fa-check-circle text-green-400"></i>
                <span>Instant Account Setup</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-yellow-300 font-bold text-lg">⭐⭐⭐⭐⭐</div>
              <div className="text-white/80 text-xs mt-1">4.9/5 Rating</div>
            </div>
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-green-300 font-bold text-lg">24/7</div>
              <div className="text-white/80 text-xs mt-1">Support</div>
            </div>
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-blue-300 font-bold text-lg">$0</div>
              <div className="text-white/80 text-xs mt-1">Setup Fee</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
