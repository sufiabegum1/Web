import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      await apiRequest('POST', '/api/wallet/deposit', { amount });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Credits added to your wallet successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsDepositDialogOpen(false);
      setDepositAmount("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add credits",
        variant: "destructive",
      });
    },
  });

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(depositAmount);
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/buy-tickets", label: "Buy Tickets" },
    { href: "/my-tickets", label: "My Tickets" },
    { href: "/trading", label: "Trading(Beta)" },
    { href: "/game-zone", label: "🎮 Game Zone" },
    { href: "/wallet", label: "Wallet" },
    { href: "/results", label: "Results" },
  ];

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="flex items-center">
                {/* Light theme logo */}
                <div className="h-8 w-auto dark:hidden" data-testid="img-logo">
                  <svg width="200" height="50" viewBox="0 0 200 50" className="h-8 w-auto">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
                        <stop offset="50%" style={{stopColor:'#8b5cf6', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#06b6d4', stopOpacity:1}} />
                      </linearGradient>
                    </defs>
                    <g transform="translate(5, 5)">
                      <rect x="2" y="8" width="36" height="24" rx="2" fill="url(#gradient)" opacity="0.8"/>
                      <circle cx="2" cy="14" r="1.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                      <circle cx="2" cy="20" r="1.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                      <circle cx="2" cy="26" r="1.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                      <circle cx="38" cy="14" r="1.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                      <circle cx="38" cy="20" r="1.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                      <circle cx="38" cy="26" r="1.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6"/>
                      <g transform="translate(12, 10)">
                        <line x1="8" y1="2" x2="8" y2="18" stroke="white" strokeWidth="1" opacity="0.9"/>
                        <rect x="5" y="6" width="6" height="8" fill="#10b981" stroke="white" strokeWidth="0.5" rx="1"/>
                        <circle cx="15" cy="4" r="1" fill="white" opacity="0.8"/>
                        <circle cx="18" cy="7" r="0.5" fill="white" opacity="0.6"/>
                        <circle cx="16" cy="10" r="0.8" fill="white" opacity="0.7"/>
                      </g>
                      <path d="M32,6 L33,3 L34,6 L37,5 L35,8 L37,11 L34,10 L33,13 L32,10 L29,11 L31,8 L29,5 Z" 
                            fill="white" opacity="0.9" transform="scale(0.3)"/>
                    </g>
                    <text x="55" y="20" fontFamily="Inter, system-ui, sans-serif" fontSize="16" fontWeight="700" fill="currentColor">
                      LUCKYWIN
                    </text>
                    <text x="55" y="35" fontFamily="Inter, system-ui, sans-serif" fontSize="9" fontWeight="500" fill="currentColor" opacity="0.7">
                      LOTTERY & TRADING
                    </text>
                  </svg>
                </div>

                {/* Dark theme logo */}
                <div className="h-8 w-auto hidden dark:block" data-testid="img-logo-dark">
                  <svg width="200" height="50" viewBox="0 0 200 50" className="h-8 w-auto">
                    <defs>
                      <linearGradient id="gradient-dark" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor:'#60a5fa', stopOpacity:1}} />
                        <stop offset="50%" style={{stopColor:'#a78bfa', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#22d3ee', stopOpacity:1}} />
                      </linearGradient>
                    </defs>
                    <g transform="translate(5, 5)">
                      <rect x="2" y="8" width="36" height="24" rx="2" fill="url(#gradient-dark)" opacity="0.9"/>
                      <circle cx="2" cy="14" r="1.5" fill="none" stroke="#f1f5f9" strokeWidth="0.8" opacity="0.8"/>
                      <circle cx="2" cy="20" r="1.5" fill="none" stroke="#f1f5f9" strokeWidth="0.8" opacity="0.8"/>
                      <circle cx="2" cy="26" r="1.5" fill="none" stroke="#f1f5f9" strokeWidth="0.8" opacity="0.8"/>
                      <circle cx="38" cy="14" r="1.5" fill="none" stroke="#f1f5f9" strokeWidth="0.8" opacity="0.8"/>
                      <circle cx="38" cy="20" r="1.5" fill="none" stroke="#f1f5f9" strokeWidth="0.8" opacity="0.8"/>
                      <circle cx="38" cy="26" r="1.5" fill="none" stroke="#f1f5f9" strokeWidth="0.8" opacity="0.8"/>
                      <g transform="translate(12, 10)">
                        <line x1="8" y1="2" x2="8" y2="18" stroke="#f1f5f9" strokeWidth="1.2" opacity="0.95"/>
                        <rect x="5" y="6" width="6" height="8" fill="#22c55e" stroke="#f1f5f9" strokeWidth="0.8" rx="1"/>
                        <circle cx="15" cy="4" r="1.2" fill="#f1f5f9" opacity="1"/>
                        <circle cx="18" cy="7" r="0.7" fill="#f1f5f9" opacity="0.8"/>
                        <circle cx="16" cy="10" r="1" fill="#f1f5f9" opacity="0.9"/>
                      </g>
                      <path d="M32,6 L33,3 L34,6 L37,5 L35,8 L37,11 L34,10 L33,13 L32,10 L29,11 L31,8 L29,5 Z" 
                            fill="#f1f5f9" opacity="1" transform="scale(0.3)"/>
                    </g>
                    <text x="55" y="20" fontFamily="Inter, system-ui, sans-serif" fontSize="16" fontWeight="700" fill="#f1f5f9">
                      LUCKYWIN
                    </text>
                    <text x="55" y="35" fontFamily="Inter, system-ui, sans-serif" fontSize="9" fontWeight="500" fill="#f1f5f9" opacity="0.8">
                      LOTTERY & TRADING
                    </text>
                  </svg>
                </div>
              </div>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors font-medium ${
                      location === item.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.label}
                  </Link>
                ))}
                {(user as any)?.isAdmin && (
                  <Link
                    href="/admin"
                    className={`transition-colors font-medium ${
                      location === "/admin"
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    data-testid="link-admin"
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (user as any)?.wallet && (
              <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                <DialogTrigger asChild>
                  <div 
                    className="hidden md:flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    data-testid="button-wallet-balance"
                  >
                    <i className="fas fa-wallet text-accent"></i>
                    <span className="text-sm font-medium">${(user as any)?.wallet?.balance || '0.00'}</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Credits to Wallet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        data-testid="input-deposit-amount"
                      />
                    </div>
                    <div className="flex space-x-2">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setDepositAmount(amount.toString())}
                          data-testid={`button-preset-${amount}`}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleDeposit}
                      disabled={depositMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-deposit"
                    >
                      {depositMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        "Add Credits"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isLoading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {(user as any)?.profileImageUrl && (
                  <img
                    src={(user as any)?.profileImageUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                    data-testid="img-profile"
                  />
                )}
                <button
                  onClick={() => window.location.href = "/api/logout"}
                  className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:bg-destructive/90 transition-colors"
                  data-testid="button-logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  data-testid="button-login"
                >
                  Login
                </button>
                <button
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  data-testid="button-register"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  Sign Up
                </button>
              </div>
            )}
            
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-foreground`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-link-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <i className={`fas ${
                    item.href === '/' ? 'fa-home' :
                    item.href === '/buy-tickets' ? 'fa-shopping-cart' :
                    item.href === '/my-tickets' ? 'fa-ticket-alt' :
                    item.href === '/trading' ? 'fa-chart-line' :
                    item.href === '/game-zone' ? 'fa-gamepad' :
                    item.href === '/dice-game' ? 'fa-dice' :
                    item.href === '/battle-game' ? 'fa-fist-raised' :
                    item.href === '/wallet' ? 'fa-wallet' :
                    'fa-trophy'
                  } mr-3`}></i>
                  {item.label}
                </Link>
              ))}
              
              {(user as any)?.isAdmin && (
                <Link
                  href="/admin"
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    location === "/admin"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-link-admin"
                >
                  <i className="fas fa-user-shield mr-3"></i>
                  Admin Dashboard
                </Link>
              )}
              
              {(user as any)?.wallet && (
                <div className="px-4 py-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Wallet Balance</span>
                    <span className="font-bold text-accent">${(user as any)?.wallet?.balance || '0.00'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsDepositDialogOpen(true);
                    }}
                    className="w-full bg-accent text-accent-foreground px-3 py-2 rounded text-sm font-medium hover:bg-accent/90 transition-colors"
                    data-testid="mobile-button-add-credits"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Credits
                  </button>
                </div>
              )}
              
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.location.href = "/api/logout";
                }}
                className="w-full bg-destructive text-destructive-foreground px-4 py-3 rounded-lg font-medium hover:bg-destructive/90 transition-colors text-left"
                data-testid="mobile-button-logout"
              >
                <i className="fas fa-sign-out-alt mr-3"></i>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
