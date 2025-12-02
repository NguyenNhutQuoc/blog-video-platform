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
  PostDetailResponse,
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
      // Response interceptor already returns response.data
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
      // Response interceptor already returns response.data
      console.log('Fetched page:', response.data);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
  });
};

// Get single post - transforms backend response to flat Post structure
export const usePost = (idOrSlug: string) => {
  return useQuery({
    queryKey: postKeys.detail(idOrSlug),
    queryFn: async (): Promise<Post> => {
      // Backend returns { post, author, categories?, tags?, video? }
      const response = await apiClient.get<PostDetailResponse>(
        `/posts/${idOrSlug}`
      );
      const data = response.data;
      console.log('Fetched post detail:', data);

      // Flatten the response into a single Post object
      return {
        ...data.post,
        author: data.author,
        categories: data.categories ?? [],
        tags: data.tags ?? [],
        video: data.video ?? null,
      };
    },
    enabled: !!idOrSlug,
  });
};

// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: CreatePostRequest): Promise<Post> => {
      console.log('Creating post with data:', postData);
      const response = await apiClient.post<PostDetailResponse>(
        '/posts',
        postData
      );
      const data = response.data;

      return {
        ...data.post,
        author: data.author,
        categories: data.categories ?? [],
        tags: data.tags ?? [],
      };
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
      const response = await apiClient.put<PostDetailResponse>(
        `/posts/${id}`,
        data
      );
      const resData = response.data;

      return {
        ...resData.post,
        author: resData.author,
        categories: resData.categories ?? [],
        tags: resData.tags ?? [],
      };
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
