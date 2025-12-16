import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient, getAccessToken } from '../lib/api-client';
import { postKeys } from './usePosts';
import type { Comment, CursorPaginatedResponse } from '../lib/types';

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  byPost: (postId: string) => [...commentKeys.all, 'post', postId] as const,
  replies: (postId: string, parentId: string) =>
    [...commentKeys.all, 'post', postId, 'replies', parentId] as const,
};

// Get root comments for a post (cursor-based)
export const usePostComments = (
  postId: string,
  viewerId?: string,
  enabled = true
) => {
  return useInfiniteQuery({
    queryKey: [...commentKeys.byPost(postId), viewerId ?? 'guest'],
    queryFn: async ({
      pageParam,
    }): Promise<CursorPaginatedResponse<Comment>> => {
      const token = getAccessToken();
      console.log('Fetching comments with token:', token ? 'YES' : 'NO');
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
    enabled: !!postId && enabled,
  });
};

// Get replies for a comment (cursor-based)
export const useCommentReplies = (
  postId: string,
  parentId: string,
  viewerId?: string
) => {
  return useInfiniteQuery({
    queryKey: [...commentKeys.replies(postId, parentId), viewerId ?? 'guest'],
    queryFn: async ({
      pageParam,
    }): Promise<CursorPaginatedResponse<Comment>> => {
      const response = await apiClient.get<CursorPaginatedResponse<Comment>>(
        `/posts/${postId}/comments`,
        {
          params: { parentId, cursor: pageParam, limit: 10 },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!postId && !!parentId,
  });
};

// Create comment (supports replies via parentId)
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      parentId,
    }: {
      postId: string;
      content: string;
      parentId?: string;
    }): Promise<Comment> => {
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        content,
        parentId,
      });
      return response.data;
    },
    onSuccess: (_, { postId, parentId }) => {
      // Invalidate root comments
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
      // If it's a reply, also invalidate the parent's replies
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(postId, parentId),
        });
      }
      // Invalidate post to update commentCount
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
};

// Delete comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
    }: {
      commentId: string;
      postId: string;
    }): Promise<void> => {
      await apiClient.delete(`/comments/${commentId}`);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate all comments for this post
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
      // Invalidate post to update commentCount
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
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
    onSuccess: (_, postId) => {
      // Invalidate specific post
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
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
    onSuccess: (_, postId) => {
      // Invalidate specific post
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Like comment
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
    }: {
      commentId: string;
      postId: string;
      parentId?: string;
    }): Promise<void> => {
      await apiClient.post(`/comments/${commentId}/like`);
    },
    onSuccess: (_, { postId, parentId }) => {
      // Invalidate all comments for this post
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
      // If it's a reply, also invalidate the parent's replies
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(postId, parentId),
        });
      }
      // Invalidate all replies queries for this post
      queryClient.invalidateQueries({
        queryKey: [...commentKeys.all, 'post', postId, 'replies'],
      });
    },
  });
};

// Unlike comment
export const useUnlikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
    }: {
      commentId: string;
      postId: string;
      parentId?: string;
    }): Promise<void> => {
      await apiClient.delete(`/comments/${commentId}/like`);
    },
    onSuccess: (_, { postId, parentId }) => {
      // Invalidate all comments for this post
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
      // If it's a reply, also invalidate the parent's replies
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(postId, parentId),
        });
      }
      // Invalidate all replies queries for this post
      queryClient.invalidateQueries({
        queryKey: [...commentKeys.all, 'post', postId, 'replies'],
      });
    },
  });
};
