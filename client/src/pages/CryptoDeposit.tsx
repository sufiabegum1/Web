import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    color: 'bg-blue-500',
    icon: 'fab fa-ethereum',
  },
  bsc: {
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    color: 'bg-yellow-500',
    icon: 'fas fa-coins',
  },
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    color: 'bg-purple-500',
    icon: 'fas fa-cube',
  },
};

export default function CryptoDeposit() {
  const { toast } = useToast();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [txHash, setTxHash] = useState<string>('');

  // Fetch user's crypto addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["/api/crypto/addresses"],
    retry: false,
  });

  // Generate crypto address mutation
  const generateAddressMutation = useMutation({
    mutationFn: async (network: string) => {
      const response = await apiRequest("POST", "/api/crypto/generate-address", { network });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/addresses"] });
      toast({
        title: "Address Generated",
        description: "Your deposit address has been created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate deposit address. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify deposit mutation
  const verifyDepositMutation = useMutation({
    mutationFn: async (data: { txHash: string; network: string; expectedAddress: string }) => {
      const response = await apiRequest("POST", "/api/crypto/verify-deposit", data);
      return await response.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Deposit Confirmed!",
        description: `Successfully added ${result.credits} credits to your wallet!`,
      });
      setTxHash('');
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: "Transaction could not be verified. Please check the hash and try again.",
        variant: "destructive",
      });
    },
  });

  const currentAddress = Array.isArray(addresses) ? addresses.find((addr: any) => addr.network === selectedNetwork) : undefined;

  const handleGenerateAddress = () => {
    generateAddressMutation.mutate(selectedNetwork);
  };

  const handleVerifyDeposit = () => {
    if (!txHash.trim()) {
      toast({
        title: "Missing Transaction Hash",
        description: "Please enter your transaction hash to verify the deposit.",
        variant: "destructive",
      });
      return;
    }

    if (!currentAddress) {
      toast({
        title: "No Deposit Address",
        description: "Please generate a deposit address first.",
        variant: "destructive",
      });
      return;
    }

    verifyDepositMutation.mutate({
      txHash: txHash.trim(),
      network: selectedNetwork,
      expectedAddress: currentAddress.address,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the address",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            <i className="fab fa-bitcoin mr-3"></i>
            Crypto Deposits
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deposit USDT from popular blockchains to add credits to your lottery wallet
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Deposit Interface */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-wallet text-green-600"></i>
                Deposit USDT
              </CardTitle>
              <CardDescription>
                Send USDT to your unique address on any supported blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Network Selection */}
              <div>
                <Label className="text-base font-semibold">Select Network</Label>
                <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork} className="mt-2">
                  <TabsList className="grid w-full grid-cols-3">
                    {Object.entries(NETWORKS).map(([key, network]) => (
                      <TabsTrigger key={key} value={key} className="text-xs">
                        <i className={`${network.icon} mr-1`}></i>
                        {network.name.split(' ')[0]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Address Generation */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Your Deposit Address</Label>
                  <Badge 
                    className={`${NETWORKS[selectedNetwork as keyof typeof NETWORKS].color} text-white`}
                  >
                    {NETWORKS[selectedNetwork as keyof typeof NETWORKS].name}
                  </Badge>
                </div>
                
                {currentAddress ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Deposit Address:</div>
                      <div className="font-mono text-sm break-all">{currentAddress.address}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(currentAddress.address)}
                        className="mt-2 w-full"
                        data-testid="button-copy-address"
                      >
                        <i className="fas fa-copy mr-2"></i>
                        Copy Address
                      </Button>
                    </div>
                    
                    {/* QR Code */}
                    {currentAddress.qrCode && (
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">Scan QR Code:</div>
                        <img 
                          src={currentAddress.qrCode} 
                          alt="Deposit QR Code"
                          className="mx-auto border rounded-lg"
                          style={{ maxWidth: '200px' }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleGenerateAddress}
                    disabled={generateAddressMutation.isPending}
                    className="w-full"
                    data-testid="button-generate-address"
                  >
                    {generateAddressMutation.isPending ? (
                      <i className="fas fa-spinner animate-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-plus mr-2"></i>
                    )}
                    Generate {NETWORKS[selectedNetwork as keyof typeof NETWORKS].name} Address
                  </Button>
                )}
              </div>

              <Separator />

              {/* Transaction Verification */}
              <div>
                <Label htmlFor="txHash" className="text-base font-semibold">
                  Verify Your Deposit
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  After sending USDT, enter your transaction hash to credit your wallet
                </p>
                <div className="space-y-3">
                  <Input
                    id="txHash"
                    placeholder="Enter transaction hash (0x...)"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    data-testid="input-tx-hash"
                  />
                  <Button
                    onClick={handleVerifyDeposit}
                    disabled={verifyDepositMutation.isPending || !currentAddress}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-verify-deposit"
                  >
                    {verifyDepositMutation.isPending ? (
                      <i className="fas fa-spinner animate-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-check mr-2"></i>
                    )}
                    Verify Deposit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Panel */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-info-circle text-blue-600"></i>
                Deposit Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">How to Deposit USDT:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>Select your preferred blockchain network (Ethereum, BSC, or Polygon)</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>Generate your unique deposit address for that network</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>Send USDT from your wallet to the generated address</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <div>Enter your transaction hash here to verify and credit your account</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-3">Supported Networks:</h3>
                <div className="space-y-3">
                  {Object.entries(NETWORKS).map(([key, network]) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className={`w-8 h-8 ${network.color} rounded-full flex items-center justify-center`}>
                        <i className={`${network.icon} text-white text-sm`}></i>
                      </div>
                      <div>
                        <div className="font-medium">{network.name}</div>
                        <div className="text-xs text-muted-foreground">USDT supported</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Important Notes:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Only send USDT tokens to the generated address</li>
                  <li>• Double-check the network before sending</li>
                  <li>• Small deposits may take longer to confirm</li>
                  <li>• 1 USDT = 1 Lottery Credit</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Addresses */}
        {Array.isArray(addresses) && addresses.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Deposit Addresses</CardTitle>
              <CardDescription>
                Previously generated addresses for different networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {addresses.map((addr: any) => (
                  <div key={addr.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 ${NETWORKS[addr.network as keyof typeof NETWORKS].color} rounded-full`}></div>
                      <span className="font-medium">{NETWORKS[addr.network as keyof typeof NETWORKS].name}</span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground break-all">
                      {addr.address}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(addr.address)}
                      className="mt-2 w-full"
                    >
                      <i className="fas fa-copy mr-1"></i>
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}