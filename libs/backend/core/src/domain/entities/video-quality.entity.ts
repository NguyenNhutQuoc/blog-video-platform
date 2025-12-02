/**
 * Video Quality Entity
 *
 * Represents an individual quality variant of a video (e.g., 360p, 720p)
 * Used to track parallel encoding status and enable granular retry logic
 */

export enum VideoQualityStatus {
  PENDING = 'pending',
  ENCODING = 'encoding',
  READY = 'ready',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface VideoQuality {
  id: string;
  videoId: string;
  qualityName: string; // '360p', '480p', '720p', '1080p'
  status: VideoQualityStatus;
  hlsPlaylistPath?: string;
  segmentsCount: number;
  retryCount: number;
  retryPriority: number; // 1=360p (highest priority), 4=1080p (lowest)
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVideoQualityInput {
  videoId: string;
  qualityName: string;
  retryPriority: number;
  status?: VideoQualityStatus;
}

export interface UpdateVideoQualityInput {
  status?: VideoQualityStatus;
  hlsPlaylistPath?: string;
  segmentsCount?: number;
  retryCount?: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}
