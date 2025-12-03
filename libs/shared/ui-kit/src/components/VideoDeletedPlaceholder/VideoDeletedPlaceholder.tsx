/**
 * VideoDeletedPlaceholder Component
 *
 * Displays a placeholder when a video in a post has been deleted.
 * Shows a message indicating the video is no longer available,
 * with an option to restore it if the user is the owner.
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  VideocamOff as VideoOffIcon,
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';

export interface VideoDeletedPlaceholderProps {
  /** Whether the current user can restore this video */
  canRestore?: boolean;
  /** Whether restore action is in progress */
  isRestoring?: boolean;
  /** Callback when user clicks restore */
  onRestore?: () => void;
  /** Time remaining until permanent deletion (optional) */
  daysUntilPermanentDeletion?: number;
  /** Aspect ratio for the placeholder */
  aspectRatio?: string;
  /** Custom class name */
  className?: string;
}

export const VideoDeletedPlaceholder: React.FC<
  VideoDeletedPlaceholderProps
> = ({
  canRestore = false,
  isRestoring = false,
  onRestore,
  daysUntilPermanentDeletion,
  aspectRatio = '16/9',
  className,
}) => {
  return (
    <Paper
      className={className}
      elevation={0}
      sx={{
        aspectRatio,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        border: '2px dashed',
        borderColor: 'grey.300',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <VideoOffIcon sx={{ fontSize: 40, color: 'grey.400' }} />
      </Box>

      {/* Title */}
      <Typography variant="h6" color="text.secondary" fontWeight={600} mb={1}>
        Video Removed
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 320, mb: 2 }}
      >
        This video has been deleted by its owner and is no longer available.
      </Typography>

      {/* Permanent deletion warning */}
      {daysUntilPermanentDeletion !== undefined &&
        daysUntilPermanentDeletion > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 2,
              px: 2,
              py: 1,
              bgcolor: 'warning.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'warning.200',
            }}
          >
            <DeleteForeverIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography variant="caption" color="warning.dark" fontWeight={500}>
              Will be permanently deleted in {daysUntilPermanentDeletion} day
              {daysUntilPermanentDeletion !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}

      {/* Restore button */}
      {canRestore && onRestore && (
        <Button
          variant="outlined"
          color="primary"
          startIcon={
            isRestoring ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RestoreIcon />
            )
          }
          onClick={onRestore}
          disabled={isRestoring}
          sx={{ mt: 1 }}
        >
          {isRestoring ? 'Restoring...' : 'Restore Video'}
        </Button>
      )}
    </Paper>
  );
};

export default VideoDeletedPlaceholder;
