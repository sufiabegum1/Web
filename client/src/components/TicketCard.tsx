import { LotteryBall } from "./LotteryBall";

interface TicketCardProps {
  ticket: any;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const getStatusColor = () => {
    if (ticket.isWinner) return "bg-accent text-accent-foreground";
    if (ticket.draw.status === "completed") return "bg-gray-100 text-gray-600";
    return "bg-blue-100 text-blue-600";
  };

  const getStatusText = () => {
    if (ticket.isWinner) return "WINNER! 🎉";
    if (ticket.draw.status === "completed") return "NO WIN";
    return "ACTIVE";
  };

  const getTimeDisplay = () => {
    if (ticket.draw.status === "completed") {
      return {
        label: "Completed",
        value: new Date(ticket.draw.drawDate).toLocaleDateString()
      };
    }
    
    const now = new Date();
    const drawDate = new Date(ticket.draw.drawDate);
    const timeDiff = drawDate.getTime() - now.getTime();
    
    if (timeDiff > 0) {
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        label: "Draw In",
        value: `${hours}h ${minutes}m`
      };
    }
    
    return {
      label: "Status",
      value: "Pending"
    };
  };

  const timeInfo = getTimeDisplay();

  return (
    <div 
      className={`ticket-card rounded-2xl border p-6 transition-all hover:shadow-lg ${
        ticket.isWinner ? 'winning-glow' : ''
      } ${ticket.draw.status === "completed" && !ticket.isWinner ? 'opacity-75' : ''}`}
      data-testid={`ticket-card-${ticket.id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          ticket.draw.lottery.type === 'daily' ? 'bg-primary/10 text-primary' :
          ticket.draw.lottery.type === 'weekly' ? 'bg-secondary/10 text-secondary' :
          'bg-purple-100 text-purple-600'
        }`}>
          {ticket.draw.lottery.name}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-lg font-bold text-card-foreground mb-1" data-testid={`ticket-number-${ticket.id}`}>
          Ticket #{ticket.ticketNumber}
        </div>
        <div className="text-sm text-muted-foreground" data-testid={`draw-date-${ticket.id}`}>
          Draw Date: {new Date(ticket.draw.drawDate).toLocaleDateString()}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-muted-foreground mb-2">Your Numbers:</div>
        <div className="flex space-x-2">
          {ticket.numbers.map((num: number, idx: number) => (
            <LotteryBall 
              key={idx} 
              number={num} 
              size="sm"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Ticket Cost</div>
          <div className="font-bold" data-testid={`ticket-cost-${ticket.id}`}>
            ${ticket.draw.lottery.ticketPrice}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm ${ticket.isWinner ? 'text-accent' : 'text-muted-foreground'}`}>
            {ticket.isWinner ? 'You Won' : timeInfo.label}
          </div>
          <div className={`font-bold ${
            ticket.isWinner ? 'text-accent text-lg' : 
            ticket.draw.status === "scheduled" ? 'text-primary' : 
            'text-muted-foreground'
          }`} data-testid={`ticket-value-${ticket.id}`}>
            {ticket.isWinner ? `$${parseFloat(ticket.prizeAmount || '0').toFixed(2)}` : timeInfo.value}
          </div>
        </div>
      </div>
    </div>
  );
}
