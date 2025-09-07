import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

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

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function WithdrawFunds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      method: undefined,
      recipientDetails: "",
    },
  });

  // Fetch user withdrawal history
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["/api/withdrawals/user"],
    retry: false,
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      const response = await apiRequest("POST", "/api/withdrawals/request", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted and is pending admin approval.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    withdrawalMutation.mutate(data);
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "bank_transfer": return "Bank Transfer";
      case "paypal": return "PayPal";
      case "crypto": return "Cryptocurrency";
      default: return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "approved": return "text-green-600 bg-green-100";
      case "rejected": return "text-red-600 bg-red-100";
      case "completed": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPlaceholderText = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Bank Name: [Bank Name]\nAccount Number: [Account Number]\nRouting Number: [Routing Number]\nAccount Holder: [Full Name]";
      case "paypal":
        return "PayPal Email: your@email.com";
      case "crypto":
        return "Wallet Address: [Your crypto wallet address]\nNetwork: [e.g., Ethereum, BSC, Polygon]";
      default:
        return "Enter recipient details...";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Withdrawal Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-money-bill-wave text-green-600"></i>
                Request Withdrawal
              </CardTitle>
              <CardDescription>
                Withdraw your winnings to your preferred payment method
              </CardDescription>
              {user?.wallet && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <div className="text-sm text-gray-600">Available Balance</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${parseFloat(user.wallet.balance).toFixed(2)}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdrawal Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="10"
                            placeholder="10.00"
                            {...field}
                            data-testid="input-withdrawal-amount"
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-gray-500">
                          Minimum withdrawal: $10.00
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdrawal Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-withdrawal-method">
                              <SelectValue placeholder="Select withdrawal method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                            <SelectItem value="paypal">💳 PayPal</SelectItem>
                            <SelectItem value="crypto">₿ Cryptocurrency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipientDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={getPlaceholderText(form.watch("method"))}
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-recipient-details"
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-gray-500">
                          Provide complete details for your chosen payment method
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={withdrawalMutation.isPending}
                    data-testid="button-submit-withdrawal"
                  >
                    {withdrawalMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Submit Withdrawal Request
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-history text-blue-600"></i>
                Withdrawal History
              </CardTitle>
              <CardDescription>
                Track your withdrawal requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !withdrawals || withdrawals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
                  <p>No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal: any) => (
                    <div
                      key={withdrawal.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-lg">
                          ${parseFloat(withdrawal.amount).toFixed(2)}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}
                        >
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <strong>Method:</strong> {getMethodLabel(withdrawal.method)}
                        </div>
                        <div>
                          <strong>Requested:</strong> {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </div>
                        {withdrawal.adminNotes && (
                          <div>
                            <strong>Admin Notes:</strong> {withdrawal.adminNotes}
                          </div>
                        )}
                        {withdrawal.approvedAt && (
                          <div>
                            <strong>Approved:</strong> {new Date(withdrawal.approvedAt).toLocaleDateString()}
                          </div>
                        )}
                        {withdrawal.rejectedAt && (
                          <div>
                            <strong>Rejected:</strong> {new Date(withdrawal.rejectedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}