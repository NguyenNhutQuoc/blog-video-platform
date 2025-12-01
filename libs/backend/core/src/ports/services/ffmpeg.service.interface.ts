/**
 * FFmpeg Service Interface
 *
 * Port interface for video processing operations using FFmpeg.
 */

/**
 * Video metadata extracted from the source file
 */
export interface VideoMetadata {
  /** Duration in seconds */
  duration: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Video codec (e.g., 'h264', 'hevc') */
  codec: string;
  /** Bitrate in bits per second */
  bitrate: number;
  /** Frame rate */
  fps: number;
  /** File size in bytes */
  fileSize: number;
  /** Container format */
  format: string;
}

/**
 * HLS encoding quality preset
 */
export interface HLSQuality {
  /** Quality name (e.g., '1080p', '720p') */
  name: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Video bitrate in kbps */
  videoBitrate: number;
  /** Audio bitrate in kbps */
  audioBitrate: number;
}

/**
 * HLS encoding result
 */
export interface HLSEncodingResult {
  /** Path to master playlist */
  masterPlaylistPath: string;
  /** Paths to quality variant playlists */
  variantPlaylists: {
    quality: string;
    playlistPath: string;
    segmentsDir: string;
  }[];
  /** Total encoding time in milliseconds */
  encodingTime: number;
}

/**
 * Encoding progress callback
 */
export type EncodingProgressCallback = (progress: {
  /** Current quality being encoded */
  quality: string;
  /** Percentage complete (0-100) */
  percent: number;
  /** Frames processed */
  frames: number;
  /** Current timestamp being processed */
  timemark: string;
}) => void;

/**
 * FFmpeg Service Port
 *
 * Defines the contract for video processing operations.
 */
export interface IFFmpegService {
  /**
   * Extract metadata from a video file
   */
  extractMetadata(inputPath: string): Promise<VideoMetadata>;

  /**
   * Generate a thumbnail from a video file
   * @param inputPath Path to the video file
   * @param outputPath Path to save the thumbnail
   * @param timestamp Timestamp to capture (default: 10% into video or 2s)
   */
  generateThumbnail(
    inputPath: string,
    outputPath: string,
    timestamp?: number | string
  ): Promise<string>;

  /**
   * Encode video to HLS format with multiple quality variants
   * @param inputPath Path to the source video
   * @param outputDir Directory to save HLS files
   * @param qualities Quality presets to encode (default: all 4 qualities)
   * @param onProgress Progress callback
   */
  encodeToHLS(
    inputPath: string,
    outputDir: string,
    qualities?: HLSQuality[],
    onProgress?: EncodingProgressCallback
  ): Promise<HLSEncodingResult>;

  /**
   * Check if FFmpeg is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get FFmpeg version
   */
  getVersion(): Promise<string>;
}

/**
 * Default HLS quality presets
 */
export const DEFAULT_HLS_QUALITIES: HLSQuality[] = [
  {
    name: '1080p',
    width: 1920,
    height: 1080,
    videoBitrate: 2800,
    audioBitrate: 192,
  },
  {
    name: '720p',
    width: 1280,
    height: 720,
    videoBitrate: 1400,
    audioBitrate: 128,
  },
  {
    name: '480p',
    width: 854,
    height: 480,
    videoBitrate: 800,
    audioBitrate: 96,
  },
  {
    name: '360p',
    width: 640,
    height: 360,
    videoBitrate: 400,
    audioBitrate: 64,
  },
];
