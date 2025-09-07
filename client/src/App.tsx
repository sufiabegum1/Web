import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import BuyTickets from "@/pages/BuyTickets";
import MyTickets from "@/pages/MyTickets";
import Results from "@/pages/Results";
import AdminDashboard from "@/pages/AdminDashboard";
import CryptoDeposit from "@/pages/CryptoDeposit";
import WithdrawFunds from "@/pages/WithdrawFunds";
import Trading from "@/pages/Trading";
import Wallet from "@/pages/Wallet";
import GameZone from "@/pages/GameZone";
import BattleGame from "@/pages/BattleGame";
import MysterySearchPage from "@/pages/MysterySearchPage";
import TryYourLuckPage from "@/pages/TryYourLuckPage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/buy-tickets" component={BuyTickets} />
          <Route path="/my-tickets" component={MyTickets} />
          <Route path="/results" component={Results} />
          <Route path="/crypto-deposit" component={CryptoDeposit} />
          <Route path="/withdraw" component={WithdrawFunds} />
          <Route path="/trading" component={Trading} />
          <Route path="/game-zone" component={GameZone} />
          <Route path="/battle-game" component={BattleGame} />
          <Route path="/mystery-search" component={MysterySearchPage} />
          <Route path="/try-your-luck" component={TryYourLuckPage} />
          <Route path="/wallet" component={Wallet} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
