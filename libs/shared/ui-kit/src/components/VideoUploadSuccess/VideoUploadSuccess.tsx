/**
 * VideoUploadSuccess Component
 *
 * Displays a beautiful success state after video upload is confirmed.
 * Shows video details and informs user about background processing.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  VideoFile as VideoFileIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  CloudDone as CloudDoneIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface VideoUploadSuccessProps {
  /** The uploaded video ID */
  videoId: string;
  /** Original filename (optional) */
  filename?: string;
  /** File size in bytes (optional) */
  fileSize?: number;
  /** Callback when user wants to remove/replace the video */
  onRemove?: () => void;
  /** Whether to show detailed information by default */
  showDetails?: boolean;
  /** Custom class name */
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const VideoUploadSuccess: React.FC<VideoUploadSuccessProps> = ({
  videoId,
  filename,
  fileSize,
  onRemove,
  showDetails = true,
  className,
}) => {
  const [expanded, setExpanded] = useState(showDetails);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(videoId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'success.main',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: (theme) => alpha(theme.palette.success.main, 0.02),
      }}
    >
      {/* Success Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.success.main,
              0.08
            )} 0%, ${alpha(theme.palette.success.light, 0.04)} 100%)`,
        }}
      >
        {/* Icon Container */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: (theme) =>
              `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`,
            flexShrink: 0,
          }}
        >
          <VideoFileIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" fontWeight={700} color="success.dark">
              Video Uploaded Successfully!
            </Typography>
            <CheckCircleIcon sx={{ fontSize: 22, color: 'success.main' }} />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Your video has been uploaded and will be processed automatically in
            the background.
          </Typography>

          {/* Status Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              size="small"
              icon={<CloudDoneIcon sx={{ fontSize: '16px !important' }} />}
              label="Upload Complete"
              color="success"
              variant="filled"
              sx={{ fontWeight: 500 }}
            />
            <Chip
              size="small"
              icon={<ScheduleIcon sx={{ fontSize: '16px !important' }} />}
              label="Processing Queued"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title={expanded ? 'Hide details' : 'Show details'}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          {onRemove && (
            <Tooltip title="Remove video">
              <IconButton
                size="small"
                onClick={onRemove}
                sx={{
                  bgcolor: 'background.paper',
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.50' },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Collapsible Details Section */}
      <Collapse in={expanded}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {/* Video ID */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ display: 'block', mb: 0.5 }}
            >
              VIDEO ID
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                bgcolor: 'grey.50',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography
                variant="body2"
                fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                sx={{
                  flex: 1,
                  wordBreak: 'break-all',
                  color: 'text.primary',
                  fontSize: '0.8rem',
                }}
              >
                {videoId}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton
                  size="small"
                  onClick={handleCopyId}
                  sx={{
                    color: copied ? 'success.main' : 'text.secondary',
                    bgcolor: copied ? 'success.50' : 'transparent',
                  }}
                >
                  {copied ? (
                    <CheckCircleIcon fontSize="small" />
                  ) : (
                    <CopyIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Additional Details Grid */}
          {(filename || fileSize) && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 2,
                mb: 2,
              }}
            >
              {filename && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    FILENAME
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {filename}
                  </Typography>
                </Box>
              )}
              {fileSize && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    FILE SIZE
                  </Typography>
                  <Typography variant="body2">
                    {formatFileSize(fileSize)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Info Box */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 1.5,
              bgcolor: 'info.50',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'info.100',
            }}
          >
            <InfoIcon sx={{ fontSize: 20, color: 'info.main', mt: 0.25 }} />
            <Box>
              <Typography variant="body2" fontWeight={600} color="info.dark">
                What happens next?
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
              >
                <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                  <li>
                    Your video is being transcoded into multiple quality levels
                    (1080p, 720p, 480p)
                  </li>
                  <li>A thumbnail will be automatically generated</li>
                  <li>
                    You'll receive a notification when processing is complete
                  </li>
                  <li>The video will be available in your post once ready</li>
                </Box>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default VideoUploadSuccess;
