import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Gift, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SurpriseDraw {
  id: string;
  title: string;
  description: string;
  prizePool: string;
  ticketPrice: string;
  numberOfWinners: number;
  rewardType: string;
  customRewardText?: string;
  status: string;
  startTime: string;
  endTime: string;
}

export default function SurpriseDraw() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<string>('');

  const { data: activeDraw, isLoading } = useQuery({
    queryKey: ['/api/surprise-draw/active'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const purchaseTicketMutation = useMutation({
    mutationFn: async (drawId: string) => {
      return await apiRequest('/api/surprise-draw/purchase', {
        method: 'POST',
        body: { drawId }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Surprise draw ticket purchased successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/surprise-draw/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!activeDraw) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(activeDraw.endTime).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Expired');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [activeDraw]);

  const handlePurchaseTicket = () => {
    if (activeDraw) {
      purchaseTicketMutation.mutate(activeDraw.id);
    }
  };

  const getRewardTypeDisplay = (rewardType: string, customText?: string) => {
    switch (rewardType) {
      case 'cash':
        return 'Cash Prize';
      case 'gift':
        return 'Gift Prize';
      case 'custom':
        return customText || 'Special Prize';
      default:
        return 'Prize';
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="surprise-draw-loading">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!activeDraw) {
    return (
      <Card data-testid="surprise-draw-inactive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Surprise Draw
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              Surprise draw is not available at this moment, keep an eye as it can appear at any time with exciting Surprise rewards.
            </div>
            <div className="text-sm text-muted-foreground">
              🎁 Stay tuned for amazing prizes!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="surprise-draw-active">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          {activeDraw.title}
          <Badge variant="secondary" data-testid="draw-status">
            {activeDraw.status === 'active' ? 'Live Now' : activeDraw.status}
          </Badge>
        </CardTitle>
        <CardDescription>{activeDraw.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer */}
        <div className="flex items-center gap-2 text-lg font-semibold" data-testid="timer-display">
          <Clock className="h-5 w-5 text-primary" />
          <span>Time Left: {timeLeft}</span>
        </div>

        {/* Prize Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Prize Pool</span>
            </div>
            <div className="text-2xl font-bold text-green-600" data-testid="prize-pool">
              ${activeDraw.prizePool}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Winners</span>
            </div>
            <div className="text-2xl font-bold text-blue-600" data-testid="number-of-winners">
              {activeDraw.numberOfWinners}
            </div>
          </div>
        </div>

        {/* Reward Type */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Reward Type:</span>
          <Badge variant="outline" data-testid="reward-type">
            {getRewardTypeDisplay(activeDraw.rewardType, activeDraw.customRewardText)}
          </Badge>
        </div>

        {/* Ticket Price and Purchase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ticket Price:</span>
            <span className="text-lg font-bold" data-testid="ticket-price">
              ${activeDraw.ticketPrice}
            </span>
          </div>
          
          <Button 
            onClick={handlePurchaseTicket}
            disabled={purchaseTicketMutation.isPending || timeLeft === 'Expired'}
            className="w-full"
            size="lg"
            data-testid="button-purchase-ticket"
          >
            {purchaseTicketMutation.isPending ? 'Purchasing...' : 'Purchase Ticket'}
          </Button>
        </div>

        {timeLeft === 'Expired' && (
          <div className="text-center text-muted-foreground text-sm">
            This surprise draw has ended. Check back for new draws!
          </div>
        )}
      </CardContent>
    </Card>
  );
}