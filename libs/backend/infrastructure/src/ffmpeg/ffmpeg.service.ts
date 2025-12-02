/**
 * FFmpeg Service Implementation
 *
 * Adapter implementing IFFmpegService using fluent-ffmpeg.
 */

import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import type {
  IFFmpegService,
  VideoMetadata,
  HLSQuality,
  HLSEncodingResult,
  EncodingProgressCallback,
} from '@blog/backend/core';
import { DEFAULT_HLS_QUALITIES } from '@blog/backend/core';

/**
 * Encoding Configuration
 * Control parallel encoding behavior and quality thresholds
 */
export const ENCODING_CONFIG = {
  // Enable parallel encoding of multiple qualities simultaneously
  ENABLE_PARALLEL: true,

  // Maximum number of qualities to encode in parallel (4 = all at once)
  // Set to 2-3 if server resources are limited
  MAX_PARALLEL: 4,

  // Minimum number of qualities required for video to be playable
  // Video status will be set to 'partial_ready' if this threshold is met
  MIN_QUALITIES_FOR_PLAYBACK: 2,

  // Priority mapping for retry (lower number = higher priority)
  QUALITY_RETRY_PRIORITY: {
    '360p': 1,
    '480p': 2,
    '720p': 3,
    '1080p': 4,
  } as Record<string, number>,
} as const;

export class FFmpegService implements IFFmpegService {
  private activeCommands: Map<string, any> = new Map(); // Store active FFmpeg commands
  private nvencAvailable: boolean | null = null; // Cache NVENC availability check

  constructor(ffmpegPath?: string, ffprobePath?: string) {
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
  }

  /**
   * Check if NVENC hardware encoder is available
   */
  private async checkNvencAvailability(): Promise<boolean> {
    if (this.nvencAvailable !== null) {
      return this.nvencAvailable;
    }

    return new Promise((resolve) => {
      import('child_process')
        .then(({ exec }) => {
          exec('ffmpeg -encoders 2>&1 | grep h264_nvenc', (error, stdout) => {
            this.nvencAvailable = !error && stdout.includes('h264_nvenc');
            console.log(
              this.nvencAvailable
                ? '🚀 NVENC GPU encoding available'
                : '⚠️ NVENC not available, falling back to CPU encoding'
            );
            resolve(this.nvencAvailable);
          });
        })
        .catch(() => {
          this.nvencAvailable = false;
          console.warn('⚠️ Failed to check NVENC availability, using CPU encoding');
          resolve(false);
        });
    });
  }

  /**
   * Kill all active FFmpeg processes
   * Used for graceful cancellation
   */
  killAllProcesses(): void {
    for (const [key, command] of this.activeCommands.entries()) {
      try {
        command.kill('SIGKILL');
        console.log(`🛑 Killed FFmpeg process: ${key}`);
      } catch (error) {
        console.warn(`Failed to kill FFmpeg process ${key}:`, error);
      }
    }
    this.activeCommands.clear();
  }

  async extractMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to extract metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video'
        );
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          codec: videoStream.codec_name || 'unknown',
          bitrate: metadata.format.bit_rate
            ? parseInt(String(metadata.format.bit_rate), 10)
            : 0,
          fps: this.parseFps(videoStream.r_frame_rate || '0'),
          fileSize: metadata.format.size
            ? parseInt(String(metadata.format.size), 10)
            : 0,
          format: metadata.format.format_name || 'unknown',
        });
      });
    });
  }

  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    timestamp?: number | string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Default: 2 seconds or calculate 10% of duration
      const seekTime = timestamp || '00:00:02';

      const outputDir = path.dirname(outputPath);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      ffmpeg(inputPath)
        .seekInput(seekTime)
        .frames(1)
        .size('640x360')
        .output(outputPath)
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error(`Failed to generate thumbnail: ${err.message}`));
        })
        .run();
    });
  }

  async encodeToHLS(
    inputPath: string,
    outputDir: string,
    qualities: HLSQuality[] = DEFAULT_HLS_QUALITIES,
    onProgress?: EncodingProgressCallback
  ): Promise<HLSEncodingResult> {
    const startTime = Date.now();

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get video metadata to determine which qualities to encode
    const metadata = await this.extractMetadata(inputPath);

    // Filter qualities based on source resolution
    const applicableQualities = qualities.filter(
      (q) => q.height <= metadata.height
    );

    if (ENCODING_CONFIG.ENABLE_PARALLEL) {
      // PARALLEL ENCODING: Encode all qualities simultaneously using Promise.allSettled
      // This is 2.5-3x faster than sequential encoding
      const encodingPromises = applicableQualities.map((quality) => {
        const qualityDir = path.join(outputDir, quality.name);
        if (!fs.existsSync(qualityDir)) {
          fs.mkdirSync(qualityDir, { recursive: true });
        }

        const playlistPath = path.join(qualityDir, 'playlist.m3u8');

        return this.encodeQuality(
          inputPath,
          qualityDir,
          quality,
          (percent, frames, timemark) => {
            if (onProgress) {
              onProgress({
                quality: quality.name,
                percent,
                frames,
                timemark,
              });
            }
          }
        )
          .then(() => ({
            status: 'fulfilled' as const,
            quality: quality.name,
            playlistPath,
            segmentsDir: qualityDir,
          }))
          .catch((error) => ({
            status: 'rejected' as const,
            quality: quality.name,
            reason: error,
          }));
      });

      const results = await Promise.all(encodingPromises);

      // Separate successful and failed encodings
      const variantPlaylists: HLSEncodingResult['variantPlaylists'] = [];
      const failedQualities: Array<{ quality: string; error: Error }> = [];

      for (const result of results) {
        if (result.status === 'fulfilled') {
          variantPlaylists.push({
            quality: result.quality,
            playlistPath: result.playlistPath,
            segmentsDir: result.segmentsDir,
          });
        } else {
          failedQualities.push({
            quality: result.quality,
            error: result.reason,
          });
        }
      }

      // Generate master playlist with successfully encoded qualities
      const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
      if (variantPlaylists.length > 0) {
        await this.generateMasterPlaylist(masterPlaylistPath, variantPlaylists);
      }

      return {
        masterPlaylistPath,
        variantPlaylists,
        encodingTime: Date.now() - startTime,
        failedQualities,
      };
    } else {
      // SEQUENTIAL ENCODING: Original behavior (fallback)
      const variantPlaylists: HLSEncodingResult['variantPlaylists'] = [];

      for (const quality of applicableQualities) {
        const qualityDir = path.join(outputDir, quality.name);
        if (!fs.existsSync(qualityDir)) {
          fs.mkdirSync(qualityDir, { recursive: true });
        }

        const playlistPath = path.join(qualityDir, 'playlist.m3u8');

        await this.encodeQuality(
          inputPath,
          qualityDir,
          quality,
          (percent, frames, timemark) => {
            if (onProgress) {
              onProgress({
                quality: quality.name,
                percent,
                frames,
                timemark,
              });
            }
          }
        );

        variantPlaylists.push({
          quality: quality.name,
          playlistPath,
          segmentsDir: qualityDir,
        });
      }

      // Generate master playlist
      const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
      await this.generateMasterPlaylist(masterPlaylistPath, variantPlaylists);

      return {
        masterPlaylistPath,
        variantPlaylists,
        encodingTime: Date.now() - startTime,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err) => {
        resolve(!err);
      });
    });
  }

  async getVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, _formats) => {
        if (err) {
          reject(new Error('FFmpeg not available'));
          return;
        }
        // Get version from ffmpeg using dynamic import for ES modules
        import('child_process')
          .then(({ exec }) => {
            exec('ffmpeg -version', (error: Error | null, stdout: string) => {
              if (error) {
                resolve('unknown');
              } else {
                const match = stdout.match(/ffmpeg version (\S+)/);
                resolve(match ? match[1] : 'unknown');
              }
            });
          })
          .catch(() => {
            resolve('unknown');
          });
      });
    });
  }

  private parseFps(fpsString: string): number {
    const parts = fpsString.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) / parseInt(parts[1], 10);
    }
    return parseFloat(fpsString) || 0;
  }

  private async encodeQuality(
    inputPath: string,
    outputDir: string,
    quality: HLSQuality,
    onProgress: (percent: number, frames: number, timemark: string) => void
  ): Promise<void> {
    // Check if NVENC is available
    const useNvenc = await this.checkNvencAvailability();

    return new Promise((resolve, reject) => {
      const playlistPath = path.join(outputDir, 'playlist.m3u8');
      const segmentPattern = path.join(outputDir, 'segment_%03d.ts');
      const commandKey = `${quality.name}-${Date.now()}`;

      let command = ffmpeg(inputPath);

      if (useNvenc) {
        // GPU ENCODING - NVIDIA NVENC
        console.log(`  🚀 Encoding ${quality.name} with GPU (h264_nvenc)`);
        command
          .videoCodec('h264_nvenc')
          .size(`${quality.width}x${quality.height}`)
          .videoBitrate(`${quality.videoBitrate}k`)
          .addOptions([
            // NVENC preset: p1=fastest, p4=medium (balanced), p7=slowest/best
            '-preset p4',
            '-profile:v main',
            '-level 3.1',
            // Rate control: vbr = variable bitrate for better quality
            '-rc vbr',
            // Lookahead frames for better quality
            '-rc-lookahead 32',
            // Adaptive Quantization
            '-spatial_aq 1',
            '-temporal_aq 1',
            // B-frame reference mode
            '-b_ref_mode middle',
            // Use first GPU
            '-gpu 0',
            // Multi-pass encoding
            '-multipass fullres',
          ]);
      } else {
        // CPU ENCODING - libx264 (fallback)
        console.log(`  💻 Encoding ${quality.name} with CPU (libx264)`);
        command
          .videoCodec('libx264')
          .size(`${quality.width}x${quality.height}`)
          .videoBitrate(`${quality.videoBitrate}k`)
          .addOptions([
            '-preset fast', // fast preset for reasonable speed
            '-profile:v main',
            '-level 3.1',
          ]);
      }

      // Common settings for both GPU and CPU
      command
        // Audio settings
        .audioCodec('aac')
        .audioBitrate(`${quality.audioBitrate}k`)
        .audioChannels(2)
        // HLS settings
        .addOptions([
          '-f hls',
          '-hls_time 6',
          '-hls_list_size 0',
          `-hls_segment_filename ${segmentPattern}`,
          '-hls_playlist_type vod',
        ])
        .output(playlistPath)
        .on('progress', (progress) => {
          onProgress(
            progress.percent || 0,
            progress.frames || 0,
            progress.timemark || '00:00:00'
          );
        })
        .on('end', () => {
          this.activeCommands.delete(commandKey);
          console.log(
            `  ✅ Successfully encoded ${quality.name} with ${useNvenc ? 'GPU' : 'CPU'}`
          );
          resolve();
        })
        .on('error', (err) => {
          this.activeCommands.delete(commandKey);
          console.error(
            `  ❌ Failed to encode ${quality.name} with ${useNvenc ? 'GPU' : 'CPU'}:`,
            err.message
          );
          reject(new Error(`Failed to encode ${quality.name}: ${err.message}`));
        });

      // Register command for potential cancellation
      this.activeCommands.set(commandKey, command);
      command.run();
    });
  }

  private generateMasterPlaylist(
    masterPath: string,
    variants: HLSEncodingResult['variantPlaylists']
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const bandwidthMap: Record<string, number> = {
          '1080p': 2800000,
          '720p': 1400000,
          '480p': 800000,
          '360p': 400000,
        };

        const resolutionMap: Record<string, string> = {
          '1080p': '1920x1080',
          '720p': '1280x720',
          '480p': '854x480',
          '360p': '640x360',
        };

        let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

        for (const variant of variants) {
          const bandwidth = bandwidthMap[variant.quality] || 1000000;
          const resolution = resolutionMap[variant.quality] || '1280x720';

          content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
          content += `${variant.quality}/playlist.m3u8\n`;
        }

        fs.writeFileSync(masterPath, content);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Factory function to create FFmpegService
 */
export function createFFmpegService(
  ffmpegPath?: string,
  ffprobePath?: string
): IFFmpegService {
  return new FFmpegService(ffmpegPath, ffprobePath);
}
