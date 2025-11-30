import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  User,
  UpdateUserRequest,
  Post,
  PaginatedResponse,
} from '../lib/types';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (username: string) => [...userKeys.details(), username] as const,
  posts: (username: string) => [...userKeys.detail(username), 'posts'] as const,
  followers: (username: string) =>
    [...userKeys.detail(username), 'followers'] as const,
  following: (username: string) =>
    [...userKeys.detail(username), 'following'] as const,
};

// Get user by username
export const useUser = (username: string) => {
  return useQuery({
    queryKey: userKeys.detail(username),
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get<{ data: User }>(
        `/users/${username}`
      );
      return response.data.data;
    },
    enabled: !!username,
  });
};

// Get user's posts with infinite scroll
export const useUserPosts = (username: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.posts(username),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Post>> => {
      const response = await apiClient.get<{ data: PaginatedResponse<Post> }>(
        `/users/${username}/posts`,
        {
          params: { page: pageParam, limit: 10 },
        }
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!username,
  });
};

// Get user's followers
export const useUserFollowers = (username: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.followers(username),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<User>> => {
      const response = await apiClient.get<{ data: PaginatedResponse<User> }>(
        `/users/${username}/followers`,
        {
          params: { page: pageParam, limit: 20 },
        }
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!username,
  });
};

// Get user's following
export const useUserFollowing = (username: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.following(username),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<User>> => {
      const response = await apiClient.get<{ data: PaginatedResponse<User> }>(
        `/users/${username}/following`,
        {
          params: { page: pageParam, limit: 20 },
        }
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!username,
  });
};

// Update own profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UpdateUserRequest): Promise<User> => {
      const response = await apiClient.put<{ data: User }>(
        '/users/me',
        userData
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(data.username),
      });
    },
  });
};
