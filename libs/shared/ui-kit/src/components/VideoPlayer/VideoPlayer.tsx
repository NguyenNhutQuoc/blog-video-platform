'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Slider,
  Stack,
  CircularProgress,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeDownIcon from '@mui/icons-material/VolumeMute';

export interface VideoQuality {
  label: string;
  src: string;
  height: number;
}

export interface VideoPlayerProps {
  /** HLS master playlist URL */
  src: string;
  /** Poster/thumbnail image URL */
  poster?: string;
  /** Video title for accessibility */
  title?: string;
  /** Auto-play on load */
  autoPlay?: boolean;
  /** Show controls */
  controls?: boolean;
  /** Start muted */
  muted?: boolean;
  /** Loop video */
  loop?: boolean;
  /** Available quality options (auto-detected from HLS if not provided) */
  qualities?: VideoQuality[];
  /** Callback when video ends */
  onEnded?: () => void;
  /** Callback when video plays */
  onPlay?: () => void;
  /** Callback when video pauses */
  onPause?: () => void;
  /** Callback when time updates */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Callback when quality changes */
  onQualityChange?: (quality: string) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Width (default: 100%) */
  width?: string | number;
  /** Height (default: auto) */
  height?: string | number;
  /** Aspect ratio (default: 16/9) */
  aspectRatio?: number;
  /** Custom CSS class */
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false,
  qualities: _qualities,
  onEnded,
  onPlay,
  onPause,
  onTimeUpdate,
  onQualityChange,
  onError,
  width = '100%',
  height = 'auto',
  aspectRatio = 16 / 9,
  className,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [availableQualities, setAvailableQualities] = useState<VideoQuality[]>(
    []
  );

  // Quality menu
  const [qualityMenuAnchor, setQualityMenuAnchor] =
    useState<null | HTMLElement>(null);
  const qualityMenuOpen = Boolean(qualityMenuAnchor);

  // Initialize player
  useEffect(() => {
    if (!videoRef.current) return;

    // Create video element
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fluid');
    videoRef.current.appendChild(videoElement);

    // Initialize Video.js player
    const player = videojs(videoElement, {
      controls: false, // We'll use custom controls
      autoplay: autoPlay,
      muted: muted,
      loop: loop,
      preload: 'auto',
      fluid: true,
      aspectRatio: `${Math.round(aspectRatio * 9)}:9`,
      responsive: true,
      sources: [
        {
          src: src,
          type: 'application/x-mpegURL',
        },
      ],
      poster: poster,
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
    });

    playerRef.current = player;

    // Event handlers
    player.on('ready', () => {
      setIsReady(true);
      setIsLoading(false);

      // Get available qualities from HLS manifest
      const tech = player.tech({ IWillNotUseThisInPlugins: true }) as any;
      if (tech && tech.vhs && tech.vhs.playlists) {
        // Wait for playlists to load
        player.on('loadedmetadata', () => {
          try {
            const playlists = tech.vhs.playlists;
            if (
              playlists &&
              playlists.media_ &&
              Array.isArray(playlists.media_)
            ) {
              const qualityList: VideoQuality[] = playlists.media_
                .filter(
                  (playlist: any) =>
                    playlist &&
                    playlist.attributes &&
                    playlist.attributes.RESOLUTION
                )
                .map((playlist: any) => ({
                  label: `${playlist.attributes.RESOLUTION.height}p`,
                  src: playlist.id,
                  height: playlist.attributes.RESOLUTION.height,
                }))
                .sort(
                  (a: VideoQuality, b: VideoQuality) => b.height - a.height
                );

              if (qualityList.length > 0) {
                qualityList.unshift({ label: 'Auto', src: 'auto', height: 0 });
                setAvailableQualities(qualityList);
              }
            }
          } catch (err) {
            console.warn('Failed to get video qualities:', err);
          }
        });
      }
    });

    player.on('play', () => {
      setIsPlaying(true);
      onPlay?.();
    });

    player.on('pause', () => {
      setIsPlaying(false);
      onPause?.();
    });

    player.on('ended', () => {
      setIsPlaying(false);
      onEnded?.();
    });

    player.on('timeupdate', () => {
      const time = player.currentTime() || 0;
      const dur = player.duration() || 0;
      setCurrentTime(time);
      setDuration(dur);
      onTimeUpdate?.(time, dur);
    });

    player.on('loadedmetadata', () => {
      setDuration(player.duration() || 0);
    });

    player.on('volumechange', () => {
      const vol = player.volume() || 0;
      setVolume(vol);
      setIsMuted(player.muted() || vol === 0);
    });

    player.on('waiting', () => {
      setIsLoading(true);
    });

    player.on('playing', () => {
      setIsLoading(false);
    });

    player.on('error', () => {
      const error = player.error();
      if (error) {
        setHasError(true);
        setIsLoading(false);

        // Check if it's a network error (file not found)
        if (error.code === 2) {
          setErrorMessage(
            'Video is still being processed. Please try again later.'
          );
        } else {
          setErrorMessage(error.message || 'Video playback error');
        }

        onError?.(new Error(error.message || 'Video playback error'));
      }
    });

    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen() || false);
    });

    // Cleanup
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src]); // Only re-create when src changes

  // Update poster when it changes
  useEffect(() => {
    if (playerRef.current && poster) {
      playerRef.current.poster(poster);
    }
  }, [poster]);

  // Control handlers
  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    player.muted(!player.muted());
  }, []);

  const handleVolumeChange = useCallback(
    (_event: Event, value: number | number[]) => {
      const player = playerRef.current;
      if (!player) return;

      const vol = Array.isArray(value) ? value[0] : value;
      player.volume(vol);
      if (vol > 0 && player.muted()) {
        player.muted(false);
      }
    },
    []
  );

  const handleSeek = useCallback((_event: Event, value: number | number[]) => {
    const player = playerRef.current;
    if (!player) return;

    const time = Array.isArray(value) ? value[0] : value;
    player.currentTime(time);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (player.isFullscreen()) {
      player.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }, []);

  const handleQualityMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setQualityMenuAnchor(event.currentTarget);
    },
    []
  );

  const handleQualityMenuClose = useCallback(() => {
    setQualityMenuAnchor(null);
  }, []);

  const handleQualityChange = useCallback(
    (quality: VideoQuality) => {
      const player = playerRef.current;
      if (!player) return;

      setCurrentQuality(quality.label);
      onQualityChange?.(quality.label);

      // Change quality using VHS API
      const tech = player.tech({ IWillNotUseThisInPlugins: true }) as any;
      if (tech && tech.vhs && tech.vhs.playlists) {
        try {
          if (quality.label === 'Auto') {
            // Re-enable auto quality selection
            if (tech.vhs.playlists.media_) {
              tech.vhs.playlists.media_.forEach((playlist: any) => {
                if (playlist) playlist.excludeUntil = 0;
              });
            }
          } else {
            // Find and select specific quality
            const targetPlaylist = tech.vhs.playlists.media_?.find(
              (p: any) => p?.attributes?.RESOLUTION?.height === quality.height
            );
            if (targetPlaylist) {
              tech.vhs.selectPlaylist = () => targetPlaylist;
            }
          }
        } catch (err) {
          console.warn('Failed to change quality:', err);
        }
      }

      handleQualityMenuClose();
    },
    [onQualityChange]
  );

  // Format time helper
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Volume icon based on level
  const VolumeIcon =
    isMuted || volume === 0
      ? VolumeOffIcon
      : volume < 0.5
      ? VolumeDownIcon
      : VolumeUpIcon;

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width,
        height,
        bgcolor: 'black',
        borderRadius: 1,
        overflow: 'hidden',
        '& .video-js': {
          width: '100%',
          height: '100%',
        },
        '& .vjs-poster': {
          backgroundSize: 'cover',
        },
      }}
    >
      {/* Video Container */}
      <Box ref={videoRef} sx={{ width: '100%', height: '100%' }} />

      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Error Overlay */}
      {hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10,
            p: 3,
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            ⚠️ Video Error
          </Typography>
          <Typography variant="body1" color="white" textAlign="center">
            {errorMessage}
          </Typography>
        </Box>
      )}

      {/* Custom Controls */}
      {controls && isReady && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            p: 1,
            pt: 3,
            zIndex: 20,
            opacity: 1,
            transition: 'opacity 0.3s',
            '&:hover': { opacity: 1 },
          }}
        >
          {/* Progress Bar */}
          <Slider
            value={currentTime}
            min={0}
            max={duration || 100}
            onChange={handleSeek as any}
            sx={{
              color: 'primary.main',
              height: 4,
              p: 0,
              mb: 1,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                transition: '0.2s',
                '&:hover': {
                  width: 16,
                  height: 16,
                },
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255,255,255,0.3)',
              },
            }}
          />

          {/* Control Bar */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Play/Pause */}
            <IconButton
              onClick={togglePlay}
              sx={{ color: 'white' }}
              size="small"
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            {/* Volume */}
            <IconButton
              onClick={toggleMute}
              sx={{ color: 'white' }}
              size="small"
            >
              <VolumeIcon />
            </IconButton>
            <Slider
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.1}
              onChange={handleVolumeChange as any}
              sx={{
                width: 60,
                color: 'white',
                '& .MuiSlider-rail': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                },
              }}
            />

            {/* Time Display */}
            <Typography variant="caption" sx={{ color: 'white', minWidth: 80 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Quality Selector */}
            {availableQualities.length > 0 && (
              <>
                <IconButton
                  onClick={handleQualityMenuOpen}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <SettingsIcon />
                </IconButton>
                <Menu
                  anchorEl={qualityMenuAnchor}
                  open={qualityMenuOpen}
                  onClose={handleQualityMenuClose}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  {availableQualities.map((q) => (
                    <MenuItem
                      key={q.label}
                      selected={currentQuality === q.label}
                      onClick={() => handleQualityChange(q)}
                    >
                      {q.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}

            {/* Fullscreen */}
            <IconButton
              onClick={toggleFullscreen}
              sx={{ color: 'white' }}
              size="small"
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Stack>
        </Box>
      )}

      {/* Center Play Button (when paused) */}
      {!isPlaying && !isLoading && isReady && (
        <Box
          onClick={togglePlay}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            zIndex: 15,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s, background-color 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
                bgcolor: 'primary.main',
              },
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 48, color: 'white' }} />
          </Box>
        </Box>
      )}

      {/* Accessibility */}
      {title && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {title}
        </Box>
      )}
    </Box>
  );
};

export default VideoPlayer;
