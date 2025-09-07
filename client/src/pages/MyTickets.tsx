import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { TicketCard } from "@/components/TicketCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function MyTickets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to view your tickets.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets/my"],
    retry: false,
  });

  const filteredTickets = Array.isArray(tickets) ? tickets.filter((ticket: any) => {
    if (filter === "all") return true;
    if (filter === "active") return ticket.draw.status === "scheduled";
    if (filter === "completed") return ticket.draw.status === "completed";
    if (filter === "winners") return ticket.isWinner;
    return true;
  }) : [];

  const totalWins = Array.isArray(tickets) ? tickets.filter((ticket: any) => ticket.isWinner).length : 0;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">🎫 My Tickets</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Track all your lottery tickets and celebrate your wins!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <i className="fas fa-ticket-alt text-white text-3xl"></i>
              </div>
              <div className="text-sm text-muted-foreground mb-2">Total Tickets Purchased</div>
              <div className="text-4xl font-bold gradient-text" data-testid="text-total-tickets">
                {Array.isArray(tickets) ? tickets.length : 0}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl winning-glow">
                <i className="fas fa-trophy text-white text-3xl"></i>
              </div>
              <div className="text-sm text-muted-foreground mb-2">Total Wins</div>
              <div className="text-4xl font-bold gradient-text" data-testid="text-total-wins">
                {totalWins}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { key: "all", label: "🎫 All Tickets", color: "from-gray-500 to-gray-600" },
              { key: "active", label: "⏰ Active", color: "from-blue-500 to-cyan-600" },
              { key: "completed", label: "✅ Completed", color: "from-green-500 to-emerald-600" },
              { key: "winners", label: "🏆 Winners", color: "from-yellow-500 to-orange-600" },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                  filter === key
                    ? `bg-gradient-to-r ${color} text-white shadow-xl`
                    : 'bg-white text-muted-foreground hover:text-foreground border border-gray-200 hover:shadow-lg'
                }`}
                data-testid={`button-filter-${key}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tickets Grid */}
          {ticketsLoading ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-muted-foreground text-xl">Loading your lucky tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <i className="fas fa-ticket-alt text-6xl text-white"></i>
              </div>
              <h3 className="text-3xl font-bold gradient-text mb-4">No Tickets Yet!</h3>
              <p className="text-muted-foreground text-xl mb-8 max-w-md mx-auto leading-relaxed">
                {filter === "all" 
                  ? "Start your lottery journey today! Your first win could be just one ticket away." 
                  : `No ${filter} tickets found. Try a different filter or buy more tickets!`}
              </p>
              <button 
                onClick={() => window.location.href = '/buy-tickets'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl"
                data-testid="button-buy-first-ticket"
              >
                <i className="fas fa-plus mr-2"></i>
                🎫 Buy Your First Ticket
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((ticket: any) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
