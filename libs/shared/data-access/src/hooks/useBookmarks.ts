import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { postKeys } from './usePosts';
import type { Post, PostSummary, CursorPaginatedResponse } from '../lib/types';

// Types
export interface BookmarkFolder {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  bookmarkCount: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  folderId: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    authorId: string;
    author: {
      id: string;
      username: string;
      fullName: string | null;
      avatarUrl: string | null;
    };
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string | null;
    createdAt: string;
  };
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateBookmarkRequest {
  postId: string;
  folderId?: string;
  note?: string;
}

export interface UpdateBookmarkRequest {
  folderId?: string;
  note?: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

// Query keys
export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  lists: () => [...bookmarkKeys.all, 'list'] as const,
  list: (folderId?: string) => [...bookmarkKeys.lists(), folderId] as const,
  folders: () => [...bookmarkKeys.all, 'folders'] as const,
};

// Get user's bookmarks with infinite scroll
export const useUserBookmarks = (folderId?: string) => {
  return useInfiniteQuery({
    queryKey: bookmarkKeys.list(folderId),
    queryFn: async ({ pageParam }): Promise<BookmarkListResponse> => {
      const params: Record<string, string> = {};
      if (folderId) params.folderId = folderId;
      if (pageParam) params.cursor = pageParam;

      const response = await apiClient.get<BookmarkListResponse>('/bookmarks', {
        params,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
  });
};

// Get user's bookmark folders
export const useBookmarkFolders = () => {
  return useQuery({
    queryKey: bookmarkKeys.folders(),
    queryFn: async (): Promise<BookmarkFolder[]> => {
      const response = await apiClient.get<{ folders: BookmarkFolder[] }>(
        '/bookmarks/folders'
      );
      return response.data.folders;
    },
  });
};

// Bookmark a post
export const useBookmarkPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookmarkRequest): Promise<Bookmark> => {
      const response = await apiClient.post<{ bookmark: Bookmark }>(
        `/posts/${data.postId}/bookmark`,
        {
          folderId: data.folderId,
          note: data.note,
        }
      );
      return response.data.bookmark;
    },
    onMutate: async (data) => {
      // Optimistically update post detail - handle both Slug and ID based keys
      await queryClient.cancelQueries({ queryKey: postKeys.details() });

      // Update any cached post that matches the ID, regardless of key (Slug vs ID)
      queryClient.setQueriesData(
        { queryKey: postKeys.details() },
        (old: Post | undefined) => {
          if (!old || old.id !== data.postId) return old;
          return {
            ...old,
            isBookmarked: true,
            bookmarkCount: (old.bookmarkCount || 0) + 1,
          };
        }
      );

      // Optimistically update post lists
      const listsKey = postKeys.lists();
      queryClient.setQueriesData(
        { queryKey: listsKey },
        (
          old: InfiniteData<CursorPaginatedResponse<PostSummary>> | undefined
        ) => {
          if (!old) return old;

          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data?.map((post: PostSummary) =>
                  post.id === data.postId
                    ? {
                        ...post,
                        isBookmarked: true,
                        bookmarkCount: (post.bookmarkCount || 0) + 1,
                      }
                    : post
                ),
                posts: page.posts?.map((post: PostSummary) =>
                  post.id === data.postId
                    ? {
                        ...post,
                        isBookmarked: true,
                        bookmarkCount: (post.bookmarkCount || 0) + 1,
                      }
                    : post
                ),
              })),
            };
          }
          return old;
        }
      );

      return {};
    },
    onError: (err, data) => {
      // Invalidate by finding queries that contain this post data
      queryClient.invalidateQueries({
        queryKey: postKeys.details(),
        predicate: (query) => (query.state.data as Post)?.id === data.postId,
      });
    },
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.folders() });

      // Invalidate the specific post detal using predicate to find match by ID
      queryClient.invalidateQueries({
        queryKey: postKeys.details(),
        predicate: (query) =>
          (query.state.data as Post)?.id === variables.postId,
      });
    },
  });
};

// Unbookmark a post
export const useUnbookmarkPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      await apiClient.delete(`/posts/${postId}/bookmark`);
    },
    onMutate: async (postId) => {
      // Optimistically update post detail - handle both Slug and ID based keys
      await queryClient.cancelQueries({ queryKey: postKeys.details() });

      // Update any cached post that matches the ID
      queryClient.setQueriesData(
        { queryKey: postKeys.details() },
        (old: Post | undefined) => {
          if (!old || old.id !== postId) return old;
          return {
            ...old,
            isBookmarked: false,
            bookmarkCount: Math.max((old.bookmarkCount || 0) - 1, 0),
          };
        }
      );

      // Optimistically update post lists
      const listsKey = postKeys.lists();
      queryClient.setQueriesData(
        { queryKey: listsKey },
        (
          old: InfiniteData<CursorPaginatedResponse<PostSummary>> | undefined
        ) => {
          if (!old) return old;

          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data?.map((post: PostSummary) =>
                  post.id === postId
                    ? {
                        ...post,
                        isBookmarked: false,
                        bookmarkCount: Math.max(
                          (post.bookmarkCount || 0) - 1,
                          0
                        ),
                      }
                    : post
                ),
                posts: page.posts?.map((post: PostSummary) =>
                  post.id === postId
                    ? {
                        ...post,
                        isBookmarked: false,
                        bookmarkCount: Math.max(
                          (post.bookmarkCount || 0) - 1,
                          0
                        ),
                      }
                    : post
                ),
              })),
            };
          }
          return old;
        }
      );

      return {};
    },
    onError: (err, postId) => {
      // Invalidate by finding queries that contain this post data
      queryClient.invalidateQueries({
        queryKey: postKeys.details(),
        predicate: (query) => (query.state.data as Post)?.id === postId,
      });
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.folders() });

      // Invalidate the specific post detal using predicate to find match by ID
      queryClient.invalidateQueries({
        queryKey: postKeys.details(),
        predicate: (query) => (query.state.data as Post)?.id === postId,
      });
    },
  });
};

// Update bookmark (change folder or note)
export const useUpdateBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookmarkId,
      ...data
    }: UpdateBookmarkRequest & { bookmarkId: string }): Promise<Bookmark> => {
      const response = await apiClient.put<{ bookmark: Bookmark }>(
        `/bookmarks/${bookmarkId}`,
        data
      );
      return response.data.bookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.folders() });
    },
  });
};

// Create bookmark folder
export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFolderRequest): Promise<BookmarkFolder> => {
      const response = await apiClient.post<{ folder: BookmarkFolder }>(
        '/bookmarks/folders',
        data
      );
      return response.data.folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.folders() });
    },
  });
};

// Update bookmark folder
export const useUpdateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      folderId,
      ...data
    }: UpdateFolderRequest & { folderId: string }): Promise<BookmarkFolder> => {
      const response = await apiClient.put<{ folder: BookmarkFolder }>(
        `/bookmarks/folders/${folderId}`,
        data
      );
      return response.data.folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.folders() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
    },
  });
};

// Delete bookmark folder
export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId: string): Promise<void> => {
      await apiClient.delete(`/bookmarks/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.folders() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
    },
  });
};
