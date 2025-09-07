import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !(user as any)?.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
    retry: false,
  });

  const { data: upcomingDraws, isLoading: drawsLoading } = useQuery({
    queryKey: ["/api/draws/upcoming"],
    retry: false,
  });

  const triggerDrawMutation = useMutation({
    mutationFn: async (drawId: string) => {
      await apiRequest('POST', '/api/admin/draw/trigger', { drawId });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Draw triggered successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/draws"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to trigger draw",
        variant: "destructive",
      });
    },
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      await apiRequest('POST', `/api/admin/withdrawals/${id}/approve`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Withdrawal approved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to approve withdrawal",
        variant: "destructive",
      });
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      await apiRequest('POST', `/api/admin/withdrawals/${id}/reject`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Withdrawal rejected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to reject withdrawal",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || !(user as any)?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">🛡️ Admin Dashboard</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Control center for managing lottery operations, users, and system performance
            </p>
            <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold mt-6 shadow-lg">
              <i className="fas fa-user-shield mr-2"></i>
              👑 Admin Access Active
            </div>
          </div>

          {/* Admin Stats */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-6"></div>
                    <div className="h-8 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-3xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <i className="fas fa-users text-white text-3xl"></i>
                    </div>
                    <div className="text-4xl font-bold gradient-text mb-2" data-testid="text-total-users">
                      {(stats as any)?.totalUsers || 0}
                    </div>
                    <h3 className="font-bold text-lg text-card-foreground mb-2">Total Players</h3>
                    <div className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-xl">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +12% this month
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <i className="fas fa-ticket-alt text-white text-3xl"></i>
                    </div>
                    <div className="text-4xl font-bold gradient-text mb-2" data-testid="text-total-tickets">
                      {(stats as any)?.totalTickets || 0}
                    </div>
                    <h3 className="font-bold text-lg text-card-foreground mb-2">Tickets Sold</h3>
                    <div className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-xl">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +8% this week
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl winning-glow">
                      <i className="fas fa-dollar-sign text-white text-3xl"></i>
                    </div>
                    <div className="text-4xl font-bold gradient-text mb-2" data-testid="text-total-revenue">
                      ${Math.abs(parseFloat((stats as any)?.totalRevenue || "0")).toLocaleString()}
                    </div>
                    <h3 className="font-bold text-lg text-card-foreground mb-2">Total Revenue</h3>
                    <div className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-xl">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +15% this month
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl winning-glow">
                      <i className="fas fa-trophy text-white text-3xl"></i>
                    </div>
                    <div className="text-4xl font-bold gradient-text mb-2" data-testid="text-total-winners">
                      {(stats as any)?.totalWinners || 0}
                    </div>
                    <h3 className="font-bold text-lg text-card-foreground mb-2">Lucky Winners</h3>
                    <div className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-xl">
                      <i className="fas fa-plus mr-1"></i>
                      +5 this week
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Draw Management */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 mb-8">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold gradient-text mb-2">
                    <i className="fas fa-cogs mr-3"></i>
                    Draw Management
                  </h3>
                  <p className="text-muted-foreground">Control upcoming lottery draws</p>
                </div>

                {drawsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading draws...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Array.isArray(upcomingDraws) && upcomingDraws.map((draw: any) => (
                      <div key={draw.id} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
                        <div className="relative bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                                draw.lottery.type === 'daily' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                draw.lottery.type === 'weekly' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                                'bg-gradient-to-br from-purple-500 to-pink-600'
                              }`}>
                                <i className={`fas ${
                                  draw.lottery.type === 'daily' ? 'fa-sun' :
                                  draw.lottery.type === 'weekly' ? 'fa-calendar-week' :
                                  'fa-calendar-alt'
                                } text-white text-2xl`}></i>
                              </div>
                              <div>
                                <h4 className="font-bold text-xl text-card-foreground">{draw.lottery.name}</h4>
                                <p className="text-sm text-muted-foreground font-medium">
                                  <i className="fas fa-clock mr-2"></i>
                                  {new Date(draw.drawDate).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                                draw.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                draw.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                <i className={`fas ${
                                  draw.status === 'scheduled' ? 'fa-clock' :
                                  draw.status === 'completed' ? 'fa-check' :
                                  'fa-exclamation'
                                } mr-2`}></i>
                                {draw.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6 mb-6">
                            <div className="text-center bg-yellow-100 rounded-xl p-4 border border-yellow-200">
                              <div className="text-sm text-muted-foreground mb-1 font-medium">💰 Prize Pool</div>
                              <div className="font-bold text-xl gradient-text">${parseInt(draw.lottery.prizePool).toLocaleString()}</div>
                            </div>
                            <div className="text-center bg-purple-100 rounded-xl p-4 border border-purple-200">
                              <div className="text-sm text-muted-foreground mb-1 font-medium">🎫 Tickets Sold</div>
                              <div className="font-bold text-xl text-card-foreground" data-testid={`text-tickets-sold-${draw.id}`}>{draw.ticketsSold}</div>
                            </div>
                            <div className="text-center bg-blue-100 rounded-xl p-4 border border-blue-200">
                              <div className="text-sm text-muted-foreground mb-1 font-medium">⏰ Time Left</div>
                              <div className="font-bold text-lg">
                                <CountdownTimer targetDate={new Date(draw.drawDate)} simple />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-center">
                            <button 
                              onClick={() => triggerDrawMutation.mutate(draw.id)}
                              disabled={triggerDrawMutation.isPending}
                              className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:from-red-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                              data-testid={`button-trigger-draw-${draw.id}`}
                            >
                              {triggerDrawMutation.isPending ? (
                                <div className="flex items-center">
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  ⚡ Triggering Draw...
                                </div>
                              ) : (
                                <>
                                  <i className="fas fa-play mr-2"></i>
                                  🚀 Trigger Draw Now
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Withdrawal Management */}
            <div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold gradient-text mb-2">
                    <i className="fas fa-money-bill-wave mr-3"></i>
                    Withdrawal Management
                  </h3>
                  <p className="text-muted-foreground text-sm">Review and approve withdrawal requests</p>
                </div>
                
                {withdrawalsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading withdrawals...</p>
                  </div>
                ) : !withdrawals || !Array.isArray(withdrawals) || withdrawals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
                    <p>No withdrawal requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(withdrawals) && withdrawals.map((withdrawal: any) => (
                      <div key={withdrawal.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-green-600">
                                ${parseFloat(withdrawal.amount).toFixed(2)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                withdrawal.status === 'approved' ? 'bg-green-100 text-green-700' :
                                withdrawal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div><strong>User:</strong> {withdrawal.user?.firstName} {withdrawal.user?.lastName} ({withdrawal.user?.email})</div>
                              <div><strong>Method:</strong> {withdrawal.method.replace('_', ' ').toUpperCase()}</div>
                              <div><strong>Requested:</strong> {new Date(withdrawal.createdAt).toLocaleString()}</div>
                              {withdrawal.adminNotes && (
                                <div><strong>Notes:</strong> {withdrawal.adminNotes}</div>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm font-medium mb-1">Recipient Details:</div>
                              <div className="text-sm text-gray-600 whitespace-pre-wrap">{withdrawal.recipientDetails}</div>
                            </div>
                          </div>
                          
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const notes = prompt("Add admin notes (optional):");
                                  approveWithdrawalMutation.mutate({ id: withdrawal.id, notes: notes || undefined });
                                }}
                                disabled={approveWithdrawalMutation.isPending || rejectWithdrawalMutation.isPending}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                              >
                                <i className="fas fa-check mr-2"></i>
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const notes = prompt("Reason for rejection:");
                                  if (notes) {
                                    rejectWithdrawalMutation.mutate({ id: withdrawal.id, notes });
                                  }
                                }}
                                disabled={approveWithdrawalMutation.isPending || rejectWithdrawalMutation.isPending}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                              >
                                <i className="fas fa-times mr-2"></i>
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User Management */}
            <div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold gradient-text mb-2">
                    <i className="fas fa-users-cog mr-3"></i>
                    User Management
                  </h3>
                  <p className="text-muted-foreground text-sm">Monitor player activity</p>
                </div>
                
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">User</th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Joined</th>
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {Array.isArray(users) && users.slice(0, 10).map((userData: any) => (
                          <tr key={userData.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={userData.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                                  alt="User profile" 
                                  className="w-8 h-8 rounded-full object-cover" 
                                />
                                <span className="font-medium text-sm" data-testid={`text-user-name-${userData.id}`}>
                                  {userData.firstName} {userData.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-sm text-muted-foreground" data-testid={`text-user-email-${userData.id}`}>
                              {userData.email}
                            </td>
                            <td className="py-3 text-sm text-muted-foreground" data-testid={`text-user-joined-${userData.id}`}>
                              {new Date(userData.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & System Status */}
            <div>
              <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-card-foreground mb-6">System Status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Draw Scheduler</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">Running</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
