/**
 * Video Upload Hooks
 *
 * React Query hooks for video upload and status tracking.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

// Types
export interface VideoUploadUrlResponse {
  videoId: string;
  uploadUrl: string;
  expiresAt: string;
  rawFilePath: string;
}

export interface VideoStatusResponse {
  id: string;
  status:
    | 'uploading'
    | 'uploaded'
    | 'processing'
    | 'ready'
    | 'partial_ready'
    | 'failed'
    | 'cancelled';
  progress?: number;
  thumbnailUrl?: string;
  hlsUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  qualities?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateUploadUrlRequest {
  filename: string;
  mimeType: string;
  fileSize: number;
  postId?: string;
}

export interface DeletedVideo {
  id: string;
  originalFilename: string;
  status: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  createdAt: string;
  deletedAt: string;
}

export interface DeleteVideoResponse {
  videoId: string;
  deleteType: 'hard' | 'soft';
  message: string;
}

export interface RestoreVideoResponse {
  videoId: string;
  status: string;
  message: string;
  requeued: boolean;
}

// Query keys
export const videoKeys = {
  all: ['videos'] as const,
  details: () => [...videoKeys.all, 'detail'] as const,
  detail: (id: string) => [...videoKeys.details(), id] as const,
  status: (id: string) => [...videoKeys.all, 'status', id] as const,
  deleted: () => [...videoKeys.all, 'deleted'] as const,
};

/**
 * Hook to generate a presigned upload URL
 */
export const useGenerateUploadUrl = () => {
  return useMutation({
    mutationFn: async (
      data: GenerateUploadUrlRequest
    ): Promise<VideoUploadUrlResponse> => {
      const response = await apiClient.post<VideoUploadUrlResponse>(
        '/videos/upload-url',
        data
      );
      return response.data;
    },
  });
};

/**
 * Hook to confirm video upload
 */
export const useConfirmUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string): Promise<void> => {
      await apiClient.post(`/videos/${videoId}/confirm`);
    },
    onSuccess: (_, videoId) => {
      // Invalidate video status query to refetch
      queryClient.invalidateQueries({ queryKey: videoKeys.status(videoId) });
    },
  });
};

/**
 * Hook to get video processing status
 */
export const useVideoStatus = (
  videoId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery({
    queryKey: videoKeys.status(videoId ?? ''),
    queryFn: async (): Promise<VideoStatusResponse> => {
      if (!videoId) throw new Error('Video ID is required');
      const response = await apiClient.get<{
        success: boolean;
        data: { status: VideoStatusResponse };
      }>(`/videos/${videoId}/status`);
      return response.data.data.status;
    },
    enabled: !!videoId && options?.enabled !== false,
    refetchInterval: (query) => {
      // Only refetch for non-terminal states
      const status = query.state.data?.status;
      if (
        status === 'uploaded' ||
        status === 'ready' ||
        status === 'partial_ready' ||
        status === 'failed' ||
        status === 'cancelled'
      ) {
        return false;
      }
      return options?.refetchInterval ?? 3000;
    },
    retry: 3,
    retryDelay: 1000,
  });
};

/**
 * Hook to delete a video
 * Uses smart deletion: hard delete if no post, soft delete if has post
 */
export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      force = false,
    }: {
      videoId: string;
      force?: boolean;
    }): Promise<DeleteVideoResponse> => {
      const response = await apiClient.delete<{
        success: boolean;
        data: DeleteVideoResponse;
      }>(`/videos/${videoId}${force ? '?force=true' : ''}`);
      return response.data.data;
    },
    onSuccess: (_, { videoId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: videoKeys.status(videoId) });
      queryClient.invalidateQueries({ queryKey: videoKeys.deleted() });
    },
  });
};

/**
 * Hook to restore a soft-deleted video
 */
export const useRestoreVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string): Promise<RestoreVideoResponse> => {
      const response = await apiClient.post<{
        success: boolean;
        data: RestoreVideoResponse;
      }>(`/videos/${videoId}/restore`);
      return response.data.data;
    },
    onSuccess: (_, videoId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: videoKeys.status(videoId) });
      queryClient.invalidateQueries({ queryKey: videoKeys.deleted() });
    },
  });
};

/**
 * Hook to get list of deleted videos for the current user
 */
export const useDeletedVideos = () => {
  return useQuery({
    queryKey: videoKeys.deleted(),
    queryFn: async (): Promise<DeletedVideo[]> => {
      const response = await apiClient.get<{
        success: boolean;
        data: { videos: DeletedVideo[] };
      }>('/videos/deleted');
      return response.data.data.videos;
    },
  });
};

/**
 * Combined hook for the full video upload workflow
 */
export const useVideoUpload = () => {
  const generateUrl = useGenerateUploadUrl();
  const confirmUpload = useConfirmUpload();

  return {
    generateUploadUrl: generateUrl.mutateAsync,
    confirmUpload: confirmUpload.mutateAsync,
    isGeneratingUrl: generateUrl.isPending,
    isConfirming: confirmUpload.isPending,
    generateError: generateUrl.error,
    confirmError: confirmUpload.error,
  };
};
