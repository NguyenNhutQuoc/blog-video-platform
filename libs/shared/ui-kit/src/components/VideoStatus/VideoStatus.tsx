/**
 * VideoStatus Component
 *
 * Displays the current processing status of a video with real-time updates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Chip,
  Collapse,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  VideoFile as VideoFileIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export type VideoProcessingStatus =
  | 'uploading'
  | 'uploaded' // New state: uploaded but not yet processing
  | 'processing'
  | 'ready'
  | 'partial_ready'
  | 'failed'
  | 'cancelled';

export interface VideoStatusData {
  /** Video ID */
  videoId: string;
  /** Current status */
  status: VideoProcessingStatus;
  /** Processing progress percentage (0-100) */
  progress?: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Error message if failed */
  error?: string;
  /** Thumbnail URL when ready */
  thumbnailUrl?: string;
  /** HLS URL when ready */
  hlsUrl?: string;
  /** Video duration in seconds */
  duration?: number;
  /** Available quality variants */
  qualities?: string[];
}

export interface VideoStatusProps {
  /** Video ID to track */
  videoId: string;
  /** Initial status data */
  initialStatus?: VideoStatusData;
  /** Callback to fetch current status */
  onFetchStatus?: (videoId: string) => Promise<VideoStatusData>;
  /** Callback when video is ready */
  onReady?: (data: VideoStatusData) => void;
  /** Callback when processing fails */
  onError?: (error: string) => void;
  /** Polling interval in ms (default: 3000) */
  pollInterval?: number;
  /** Show detailed information */
  showDetails?: boolean;
  /** Custom class name */
  className?: string;
}

const statusConfig: Record<
  VideoProcessingStatus,
  {
    label: string;
    color: 'default' | 'primary' | 'success' | 'error' | 'warning';
    icon: React.ReactNode;
  }
> = {
  uploading: {
    label: 'Uploading',
    color: 'primary',
    icon: <ScheduleIcon />,
  },
  uploaded: {
    label: 'Uploaded',
    color: 'success',
    icon: <CheckCircleIcon />,
  },
  processing: {
    label: 'Processing',
    color: 'primary',
    icon: <ScheduleIcon />,
  },
  ready: {
    label: 'Ready',
    color: 'success',
    icon: <CheckCircleIcon />,
  },
  partial_ready: {
    label: 'Partial Ready',
    color: 'warning',
    icon: <CheckCircleIcon />,
  },
  failed: {
    label: 'Failed',
    color: 'error',
    icon: <ErrorIcon />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'warning',
    icon: <ErrorIcon />,
  },
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoStatus: React.FC<VideoStatusProps> = ({
  videoId,
  initialStatus,
  onFetchStatus,
  onReady,
  onError,
  pollInterval = 3000,
  showDetails = false,
  className,
}) => {
  const [status, setStatus] = useState<VideoStatusData | null>(
    initialStatus || null
  );
  const [expanded, setExpanded] = useState(showDetails);
  const [isPolling, setIsPolling] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!onFetchStatus) return;

    try {
      const data = await onFetchStatus(videoId);
      console.log('Fetched video status:', data);
      setStatus(data);

      // Check for completion states
      if (data.status === 'ready') {
        onReady?.(data);
      } else if (data.status === 'failed') {
        onError?.(data.error || 'Processing failed');
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch video status:', error);
      return null;
    }
  }, [videoId, onFetchStatus, onReady, onError]);

  // Start polling when status is processing
  useEffect(() => {
    if (!onFetchStatus) return;

    // Initial fetch
    fetchStatus();

    // Only poll for non-terminal states (uploaded state is terminal - no need to poll)
    const shouldPoll =
      !status ||
      status.status === 'uploading' ||
      status.status === 'processing';

    if (!shouldPoll) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(() => {
      fetchStatus().then((data) => {
        if (
          data &&
          (data.status === 'uploaded' ||
            data.status === 'ready' ||
            data.status === 'partial_ready' ||
            data.status === 'failed' ||
            data.status === 'cancelled')
        ) {
          clearInterval(interval);
          setIsPolling(false);
        }
      });
    }, pollInterval);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [fetchStatus, pollInterval, status?.status, onFetchStatus]);

  const handleRefresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (!status) {
    return (
      <Paper className={className} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ color: 'grey.400', mr: 2 }} />
          <Typography color="text.secondary">Loading status...</Typography>
        </Box>
      </Paper>
    );
  }

  const config = statusConfig[status.status];
  const isTerminal =
    status.status === 'uploaded' ||
    status.status === 'ready' ||
    status.status === 'partial_ready' ||
    status.status === 'failed' ||
    status.status === 'cancelled';

  return (
    <Paper className={className} sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <VideoFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" fontWeight="medium">
              Video Processing
            </Typography>
            <Chip
              size="small"
              label={config.label}
              color={config.color}
              icon={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {config.icon}
                </Box>
              }
            />
            {isPolling && (
              <Typography variant="caption" color="text.secondary">
                Updating...
              </Typography>
            )}
          </Box>

          {/* Progress bar for processing states */}
          {(status.status === 'uploading' ||
            status.status === 'processing') && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant={
                  status.progress !== undefined
                    ? 'determinate'
                    : 'indeterminate'
                }
                value={status.progress ?? 0}
                sx={{ height: 6, borderRadius: 1 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 0.5,
                }}
              >
                {status.progress !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    {status.progress}% complete
                  </Typography>
                )}
                {status.estimatedTimeRemaining !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    ~{formatTime(status.estimatedTimeRemaining)} remaining
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box>
          {!isPolling && !isTerminal && (
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          )}
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{ ml: 1 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Uploaded message - ready to create post */}
      {status.status === 'uploaded' && (
        <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
          Video uploaded successfully! You can now create your post. The video
          will be processed in the background and will be available shortly.
        </Alert>
      )}

      {/* Error message */}
      {status.status === 'failed' && status.error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {status.error}
        </Alert>
      )}

      {/* Thumbnail preview for ready videos */}
      {status.status === 'ready' && status.thumbnailUrl && (
        <Box
          sx={{
            mx: 2,
            mb: 2,
            borderRadius: 1,
            overflow: 'hidden',
            maxHeight: 200,
          }}
        >
          <img
            src={status.thumbnailUrl}
            alt="Video thumbnail"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </Box>
      )}

      {/* Details section */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Details
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 1,
              fontSize: '0.875rem',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Video ID:
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              {videoId}
            </Typography>

            {status.duration !== undefined && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Duration:
                </Typography>
                <Typography variant="body2">
                  {formatDuration(status.duration)}
                </Typography>
              </>
            )}

            {status.qualities && status.qualities.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Qualities:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {status.qualities.map((q) => (
                    <Chip key={q} label={q} size="small" variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {status.hlsUrl && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Stream URL:
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{ wordBreak: 'break-all' }}
                >
                  {status.hlsUrl}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default VideoStatus;
