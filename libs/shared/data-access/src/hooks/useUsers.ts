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
  CursorPaginatedResponse,
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
      const response = await apiClient.get<User>(`/users/${username}`);
      return response as unknown as User;
    },
    enabled: !!username,
  });
};

// Get user's posts with infinite scroll (cursor-based)
export const useUserPosts = (username: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.posts(username),
    queryFn: async ({ pageParam }): Promise<CursorPaginatedResponse<Post>> => {
      const response = await apiClient.get<CursorPaginatedResponse<Post>>(
        `/users/${username}/posts`,
        {
          params: { cursor: pageParam, limit: 10 },
        }
      );
      return response as unknown as CursorPaginatedResponse<Post>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!username,
  });
};

// Get user's followers (cursor-based)
export const useUserFollowers = (username: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.followers(username),
    queryFn: async ({ pageParam }): Promise<CursorPaginatedResponse<User>> => {
      const response = await apiClient.get<CursorPaginatedResponse<User>>(
        `/users/${username}/followers`,
        {
          params: { cursor: pageParam, limit: 20 },
        }
      );
      return response as unknown as CursorPaginatedResponse<User>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!username,
  });
};

// Get user's following (cursor-based)
export const useUserFollowing = (username: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.following(username),
    queryFn: async ({ pageParam }): Promise<CursorPaginatedResponse<User>> => {
      const response = await apiClient.get<CursorPaginatedResponse<User>>(
        `/users/${username}/following`,
        {
          params: { cursor: pageParam, limit: 20 },
        }
      );
      return response as unknown as CursorPaginatedResponse<User>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!username,
  });
};

// Update own profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UpdateUserRequest): Promise<User> => {
      const response = await apiClient.put<User>('/users/me', userData);
      return response as unknown as User;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(data.username),
      });
    },
  });
};
