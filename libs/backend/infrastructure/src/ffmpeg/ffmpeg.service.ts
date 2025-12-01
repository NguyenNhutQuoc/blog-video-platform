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

export class FFmpegService implements IFFmpegService {
  constructor(ffmpegPath?: string, ffprobePath?: string) {
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
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
    const variantPlaylists: HLSEncodingResult['variantPlaylists'] = [];

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

    // Encode each quality
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

  private encodeQuality(
    inputPath: string,
    outputDir: string,
    quality: HLSQuality,
    onProgress: (percent: number, frames: number, timemark: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const playlistPath = path.join(outputDir, 'playlist.m3u8');
      const segmentPattern = path.join(outputDir, 'segment_%03d.ts');

      ffmpeg(inputPath)
        // Video settings
        .videoCodec('libx264')
        .size(`${quality.width}x${quality.height}`)
        .videoBitrate(`${quality.videoBitrate}k`)
        .addOptions(['-preset fast', '-profile:v main', '-level 3.1'])
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
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(`Failed to encode ${quality.name}: ${err.message}`));
        })
        .run();
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
