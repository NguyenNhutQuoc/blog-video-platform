/**
 * Notification Service Interface
 *
 * Port for sending notifications about video encoding events
 */

export enum NotificationType {
  VIDEO_READY = 'video_ready',
  VIDEO_PARTIAL_READY = 'video_partial_ready',
  VIDEO_FAILED = 'video_failed',
  QUALITY_FAILED = 'quality_failed',
}

export interface VideoNotificationData {
  videoId: string;
  userId: string;
  videoTitle?: string;
  thumbnailUrl?: string;
  hlsUrl?: string;
  availableQualities?: string[];
  failedQualities?: string[];
  errorMessage?: string;
}

export interface INotificationService {
  /**
   * Notify user when video encoding is fully ready
   */
  notifyVideoReady(data: VideoNotificationData): Promise<void>;

  /**
   * Notify user when video is partially ready (some qualities failed)
   * Video is playable but not all qualities are available
   */
  notifyVideoPartialReady(data: VideoNotificationData): Promise<void>;

  /**
   * Notify user when video encoding completely failed
   */
  notifyVideoFailed(data: VideoNotificationData): Promise<void>;

  /**
   * Notify admin when a quality retry fails multiple times
   */
  notifyQualityRetryFailed(data: VideoNotificationData): Promise<void>;
}
