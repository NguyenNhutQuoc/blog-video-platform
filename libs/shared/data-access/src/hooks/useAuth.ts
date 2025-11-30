import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, setTokens, clearTokens } from '../lib/api-client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '../lib/types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// Get current user
export const useMe = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get<{ data: User }>('/auth/me');
      return response.data.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<{ data: AuthResponse }>(
        '/auth/login',
        credentials
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: RegisterRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<{ data: AuthResponse }>(
        '/auth/register',
        userData
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string): Promise<{ message: string }> => {
      const response = await apiClient.post<{ data: { message: string } }>(
        '/auth/forgot-password',
        { email }
      );
      return response.data.data;
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }): Promise<{ message: string }> => {
      const response = await apiClient.post<{ data: { message: string } }>(
        '/auth/reset-password',
        {
          token,
          password,
        }
      );
      return response.data.data;
    },
  });
};
