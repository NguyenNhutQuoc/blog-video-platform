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

// Query keys
export const videoKeys = {
  all: ['videos'] as const,
  details: () => [...videoKeys.all, 'detail'] as const,
  detail: (id: string) => [...videoKeys.details(), id] as const,
  status: (id: string) => [...videoKeys.all, 'status', id] as const,
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
