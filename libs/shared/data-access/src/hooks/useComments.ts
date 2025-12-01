import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Comment, CursorPaginatedResponse } from '../lib/types';

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  byPost: (postId: string) => [...commentKeys.all, 'post', postId] as const,
};

// Get comments for a post (cursor-based)
export const usePostComments = (postId: string) => {
  return useInfiniteQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: async ({
      pageParam,
    }): Promise<CursorPaginatedResponse<Comment>> => {
      const response = await apiClient.get<CursorPaginatedResponse<Comment>>(
        `/posts/${postId}/comments`,
        {
          params: { cursor: pageParam, limit: 10 },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
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
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        content,
      });
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
