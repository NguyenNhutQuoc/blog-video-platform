import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { User, PaginatedResponse } from '../lib/types';

// Query keys
export const followKeys = {
  all: ['follows'] as const,
  followers: (username: string) =>
    [...followKeys.all, 'followers', username] as const,
  following: (username: string) =>
    [...followKeys.all, 'following', username] as const,
};

// Get followers
export const useFollowers = (username: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...followKeys.followers(username), page, limit],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const response = await apiClient.get(`/users/${username}/followers`, {
        params: { page, limit },
      });
      return response.data;
    },
    enabled: !!username,
  });
};

// Get following
export const useFollowing = (username: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...followKeys.following(username), page, limit],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const response = await apiClient.get(`/users/${username}/following`, {
        params: { page, limit },
      });
      return response.data;
    },
    enabled: !!username,
  });
};

// Follow user
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      await apiClient.post(`/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Unfollow user
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      await apiClient.delete(`/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
