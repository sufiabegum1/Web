import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  History,
  Plus,
  Minus,
  DollarSign,
  Eye,
  Bitcoin
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Schemas for validation
const depositSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 1;
    },
    "Minimum deposit amount is $1"
  ),
});

const withdrawalSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 10;
    },
    "Minimum withdrawal amount is $10"
  ),
  method: z.enum(["bank_transfer", "paypal", "crypto"], {
    required_error: "Please select a withdrawal method",
  }),
  recipientDetails: z.string().min(10, "Recipient details must be at least 10 characters"),
});

type DepositFormData = z.infer<typeof depositSchema>;
type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WalletData {
  id: string;
  userId: string;
  balance: string;
  bonusBalance: string;
  totalDeposits: string;
  totalWithdrawals: string;
  totalWinnings: string;
  totalBonuses: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  status: string;
  createdAt: Date;
  cryptoNetwork?: string;
  cryptoTxHash?: string;
}

const NETWORKS = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
  bsc: { name: 'Binance Smart Chain', symbol: 'BNB', color: 'bg-yellow-500' },
  polygon: { name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
};

export default function Wallet() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);

  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['/api/wallet/details'],
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/wallet/transactions'],
    enabled: !!user,
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequests = [] } = useQuery({
    queryKey: ['/api/wallet/withdrawal-requests'],
    enabled: !!user,
  });

  // Forms
  const depositForm = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: '' },
  });

  const withdrawalForm = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { amount: '', method: undefined, recipientDetails: '' },
  });

  // Deposit mutation (manual credit addition)
  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormData) => {
      return await apiRequest('/api/wallet/deposit', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Credits added to your wallet successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
      depositForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add credits",
        variant: "destructive",
      });
    },
  });

  // Withdrawal request mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      return await apiRequest('/api/wallet/request-withdrawal', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/withdrawal-requests'] });
      withdrawalForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  // Generate crypto address
  const generateAddressMutation = useMutation({
    mutationFn: async (network: string) => {
      return await apiRequest('/api/crypto/generate-address', 'POST', { network });
    },
    onSuccess: (data) => {
      setCurrentAddress(data.address);
      toast({
        title: "Address Generated",
        description: "New deposit address generated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate address",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAddress = () => {
    setIsGeneratingAddress(true);
    generateAddressMutation.mutate(selectedNetwork);
    setTimeout(() => setIsGeneratingAddress(false), 1000);
  };

  const onDepositSubmit = (data: DepositFormData) => {
    depositMutation.mutate(data);
  };

  const onWithdrawalSubmit = (data: WithdrawalFormData) => {
    const availableBalance = parseFloat(walletData?.balance || '0');
    const requestedAmount = parseFloat(data.amount);
    
    if (requestedAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return;
    }
    
    withdrawalMutation.mutate(data);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'crypto_deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'bonus':
        return <Gift className="w-4 h-4 text-purple-500" />;
      case 'prize_win':
      case 'trading_win':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'trading_loss':
      case 'ticket_purchase':
        return <Minus className="w-4 h-4 text-red-500" />;
      default:
        return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'crypto_deposit':
      case 'bonus':
      case 'prize_win':
      case 'trading_win':
        return 'text-green-600';
      case 'withdrawal':
      case 'trading_loss':
      case 'ticket_purchase':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    const typeMap: Record<string, string> = {
      deposit: 'Deposit',
      crypto_deposit: 'Crypto Deposit',
      withdrawal: 'Withdrawal',
      bonus: 'Bonus',
      prize_win: 'Prize Win',
      trading_win: 'Trading Win',
      trading_loss: 'Trading Loss',
      ticket_purchase: 'Ticket Purchase',
    };
    return typeMap[type] || type;
  };

  if (authLoading || walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <WalletIcon className="w-10 h-10 text-blue-400" />
            Wallet Dashboard
          </h1>
          <p className="text-gray-300">Manage your balance, deposits, withdrawals and transaction history</p>
        </div>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/30 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Balance</p>
                  <p className="text-3xl font-bold">
                    ${parseFloat(walletData?.balance || '0').toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <WalletIcon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Deposits */}
          <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500/30 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Deposits</p>
                  <p className="text-2xl font-bold">
                    ${parseFloat(walletData?.totalDeposits || '0').toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Winnings */}
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500/30 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Winnings</p>
                  <p className="text-2xl font-bold">
                    ${parseFloat(walletData?.totalWinnings || '0').toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Withdrawals */}
          <Card className="bg-gradient-to-br from-red-600 to-red-700 border-red-500/30 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Total Withdrawals</p>
                  <p className="text-2xl font-bold">
                    ${parseFloat(walletData?.totalWithdrawals || '0').toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/30 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Wallet Interface */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl">
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-700/50">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
                  <Eye className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="deposit" className="data-[state=active]:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="crypto-deposit" className="data-[state=active]:bg-orange-600">
                  <Bitcoin className="w-4 h-4 mr-2" />
                  Crypto
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="data-[state=active]:bg-red-600">
                  <Minus className="w-4 h-4 mr-2" />
                  Withdraw
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
                  <History className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="text-center py-8">
                  <WalletIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Wallet Overview</h3>
                  <p className="text-gray-400 mb-6">Your complete financial summary</p>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400">Available Balance</p>
                      <p className="text-xl font-bold text-green-400">
                        ${parseFloat(walletData?.balance || '0').toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400">Bonus Balance</p>
                      <p className="text-xl font-bold text-purple-400">
                        ${parseFloat(walletData?.bonusBalance || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Manual Deposit Tab */}
              <TabsContent value="deposit" className="space-y-6">
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <Plus className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white">Add Credits</h3>
                    <p className="text-gray-400">Manually add credits to your wallet</p>
                  </div>

                  <Form {...depositForm}>
                    <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
                      <FormField
                        control={depositForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="1"
                                placeholder="10.00"
                                className="bg-gray-700/50 border-gray-600 text-white"
                                {...field}
                                data-testid="input-deposit-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2">
                        {[10, 25, 50, 100].map((amount) => (
                          <Button
                            key={amount}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => depositForm.setValue('amount', amount.toString())}
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>

                      <Button
                        type="submit"
                        disabled={depositMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="button-submit-deposit"
                      >
                        {depositMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Credits
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              {/* Crypto Deposit Tab */}
              <TabsContent value="crypto-deposit" className="space-y-6">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <Bitcoin className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white">Crypto Deposit</h3>
                    <p className="text-gray-400">Deposit USDT from supported blockchains</p>
                  </div>

                  {/* Network Selection */}
                  <div className="mb-6">
                    <Label className="text-white text-base font-semibold block mb-3">Select Network</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(NETWORKS).map(([key, network]) => (
                        <Button
                          key={key}
                          variant={selectedNetwork === key ? "default" : "outline"}
                          onClick={() => setSelectedNetwork(key)}
                          className={`p-4 h-auto ${
                            selectedNetwork === key
                              ? `${network.color} text-white`
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-semibold">{network.name}</div>
                            <div className="text-sm opacity-80">{network.symbol}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Address Generation */}
                  <div className="text-center">
                    <Button
                      onClick={handleGenerateAddress}
                      disabled={isGeneratingAddress || generateAddressMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isGeneratingAddress || generateAddressMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Generating...
                        </div>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Generate Deposit Address
                        </>
                      )}
                    </Button>

                    {currentAddress && (
                      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                        <Label className="text-white text-sm">Deposit Address:</Label>
                        <div className="mt-2 p-3 bg-gray-800 rounded border text-sm font-mono text-green-400 break-all">
                          {currentAddress}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Send USDT to this address on the {NETWORKS[selectedNetwork as keyof typeof NETWORKS].name} network
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Withdraw Tab */}
              <TabsContent value="withdraw" className="space-y-6">
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <ArrowUpRight className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white">Request Withdrawal</h3>
                    <p className="text-gray-400">
                      Available: ${parseFloat(walletData?.balance || '0').toFixed(2)}
                    </p>
                  </div>

                  <Form {...withdrawalForm}>
                    <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)} className="space-y-4">
                      <FormField
                        control={withdrawalForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Withdrawal Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="10"
                                placeholder="10.00"
                                className="bg-gray-700/50 border-gray-600 text-white"
                                {...field}
                                data-testid="input-withdrawal-amount"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-400">Minimum withdrawal: $10.00</p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={withdrawalForm.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Withdrawal Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                <SelectItem value="bank_transfer" className="text-white">
                                  Bank Transfer
                                </SelectItem>
                                <SelectItem value="paypal" className="text-white">
                                  PayPal
                                </SelectItem>
                                <SelectItem value="crypto" className="text-white">
                                  Cryptocurrency
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={withdrawalForm.control}
                        name="recipientDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Recipient Details</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Bank account, PayPal email, or crypto address"
                                className="bg-gray-700/50 border-gray-600 text-white"
                                {...field}
                                data-testid="input-recipient-details"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={withdrawalMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700"
                        data-testid="button-submit-withdrawal"
                      >
                        {withdrawalMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Submitting...
                          </div>
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Request Withdrawal
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>

                  {/* Withdrawal Requests */}
                  {withdrawalRequests.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-white font-semibold mb-4">Pending Requests</h4>
                      <div className="space-y-2">
                        {withdrawalRequests.slice(0, 3).map((request: any) => (
                          <div key={request.id} className="bg-gray-700/30 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">${parseFloat(request.amount).toFixed(2)}</p>
                                <p className="text-xs text-gray-400">{request.method}</p>
                              </div>
                              <Badge 
                                variant={
                                  request.status === 'approved' ? 'default' :
                                  request.status === 'rejected' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Transaction History Tab */}
              <TabsContent value="history" className="space-y-6">
                <div className="text-center mb-6">
                  <History className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white">Transaction History</h3>
                  <p className="text-gray-400">All your wallet activities</p>
                </div>

                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-400">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <p className="text-white font-medium">
                                {formatTransactionType(transaction.type)}
                              </p>
                              <p className="text-sm text-gray-400">
                                {transaction.description}
                              </p>
                              {transaction.cryptoTxHash && (
                                <p className="text-xs text-blue-400 font-mono">
                                  {transaction.cryptoTxHash.slice(0, 8)}...{transaction.cryptoTxHash.slice(-8)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                              {transaction.type.includes('withdrawal') || transaction.type.includes('loss') || transaction.type.includes('purchase') ? '-' : '+'}
                              ${parseFloat(transaction.amount).toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  transaction.status === 'confirmed' ? 'default' :
                                  transaction.status === 'failed' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {transaction.status}
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}