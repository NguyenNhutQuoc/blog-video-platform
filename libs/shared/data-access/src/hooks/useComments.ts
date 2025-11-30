import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Comment, PaginatedResponse } from '../lib/types';

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  byPost: (postId: string) => [...commentKeys.all, 'post', postId] as const,
};

// Get comments for a post
export const usePostComments = (postId: string) => {
  return useInfiniteQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Comment>> => {
      const response = (await apiClient.get(`/posts/${postId}/comments`, {
        params: { page: pageParam, limit: 10 },
      })) as PaginatedResponse<Comment>;
      return response;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!postId,
  });
};

// Create comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: {
      postId: string;
      content: string;
    }): Promise<Comment> => {
      const response = (await apiClient.post(`/posts/${postId}/comments`, {
        content,
      })) as { data: Comment };
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });
};

// Like post
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      await apiClient.post(`/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Unlike post
export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      await apiClient.delete(`/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
