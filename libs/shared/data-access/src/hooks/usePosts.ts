import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  PostFilters,
  PaginatedResponse,
} from '../lib/types';

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostFilters) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// Get posts with pagination
export const usePosts = (filters: PostFilters = {}) => {
  return useQuery({
    queryKey: postKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Post>> => {
      const response = await apiClient.get<{ data: PaginatedResponse<Post> }>(
        '/posts',
        {
          params: filters,
        }
      );
      return response.data.data;
    },
  });
};

// Get posts with infinite scroll
export const useInfinitePosts = (filters: Omit<PostFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: postKeys.list({ ...filters, page: undefined }),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Post>> => {
      const response = await apiClient.get<{ data: PaginatedResponse<Post> }>(
        '/posts',
        {
          params: { ...filters, page: pageParam },
        }
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// Get single post
export const usePost = (idOrSlug: string) => {
  return useQuery({
    queryKey: postKeys.detail(idOrSlug),
    queryFn: async (): Promise<Post> => {
      const response = await apiClient.get<{ data: Post }>(
        `/posts/${idOrSlug}`
      );
      return response.data.data;
    },
    enabled: !!idOrSlug,
  });
};

// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: CreatePostRequest): Promise<Post> => {
      const response = await apiClient.post<{ data: Post }>('/posts', postData);
      return response.data.data;
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
      const response = await apiClient.put<{ data: Post }>(
        `/posts/${id}`,
        data
      );
      return response.data.data;
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
