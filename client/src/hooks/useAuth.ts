import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 5000, // Refresh every 5 seconds to update balance
    staleTime: 4000, // Consider stale after 4 seconds
  });

  // If we get a 401 error, user is not authenticated - this is expected for logged out users
  const isAuthError = error && error.message.includes('401');
  
  return {
    user,
    isLoading: isLoading && !isAuthError,
    isAuthenticated: !!user && !isAuthError,
  };
}
