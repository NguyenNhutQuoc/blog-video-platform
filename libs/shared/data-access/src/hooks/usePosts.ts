import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  Post,
  PostSummary,
  CreatePostRequest,
  UpdatePostRequest,
  PostFilters,
  CursorPaginatedResponse,
} from '../lib/types';

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostFilters) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// Get posts with cursor-based pagination
export const usePosts = (filters: PostFilters = {}) => {
  return useQuery({
    queryKey: postKeys.list(filters),
    queryFn: async (): Promise<CursorPaginatedResponse<PostSummary>> => {
      const response = await apiClient.get<
        CursorPaginatedResponse<PostSummary>
      >('/posts', {
        params: filters,
      });
      return response.data;
    },
  });
};

// Get posts with infinite scroll (cursor-based)
export const useInfinitePosts = (filters: Omit<PostFilters, 'cursor'> = {}) => {
  return useInfiniteQuery({
    queryKey: postKeys.list({ ...filters, cursor: undefined }),
    queryFn: async ({
      pageParam,
    }): Promise<CursorPaginatedResponse<PostSummary>> => {
      const response = await apiClient.get<
        CursorPaginatedResponse<PostSummary>
      >('/posts', {
        params: { ...filters, cursor: pageParam },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
  });
};

// Get single post
export const usePost = (idOrSlug: string) => {
  return useQuery({
    queryKey: postKeys.detail(idOrSlug),
    queryFn: async (): Promise<Post> => {
      const response = await apiClient.get<Post>(`/posts/${idOrSlug}`);
      return response.data;
    },
    enabled: !!idOrSlug,
  });
};

// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: CreatePostRequest): Promise<Post> => {
      const response = await apiClient.post<Post>('/posts', postData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Update post
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdatePostRequest): Promise<Post> => {
      const response = await apiClient.put<Post>(`/posts/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.id) });
    },
  });
};

// Delete post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};
