/**
 * VideoUpload Component
 *
 * A drag-and-drop video upload component with progress tracking.
 * Uses presigned URLs for direct upload to MinIO/S3.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Paper,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  VideoFile as VideoFileIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export interface VideoUploadConfig {
  /** Maximum file size in bytes (default: 2GB) */
  maxFileSize?: number;
  /** Maximum video duration in seconds (default: 30 minutes) */
  maxDuration?: number;
  /** Accepted file types */
  acceptedTypes?: string[];
}

export interface UploadState {
  /** Current upload status */
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Error message if any */
  error?: string;
  /** Video ID after upload confirmation */
  videoId?: string;
}

export interface VideoUploadProps {
  /** Callback when upload starts - should return presigned URL */
  onUploadStart?: (
    file: File
  ) => Promise<{ uploadUrl: string; videoId: string }>;
  /** Callback when upload completes */
  onUploadComplete?: (videoId: string) => void;
  /** Callback when upload fails */
  onUploadError?: (error: Error) => void;
  /** Callback to confirm upload */
  onConfirmUpload?: (videoId: string) => Promise<void>;
  /** Configuration options */
  config?: VideoUploadConfig;
  /** Custom class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

const DEFAULT_CONFIG: VideoUploadConfig = {
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxDuration: 30 * 60, // 30 minutes
  acceptedTypes: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
  ],
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  onConfirmUpload,
  config = {},
  className,
  disabled = false,
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (
        mergedConfig.acceptedTypes &&
        !mergedConfig.acceptedTypes.includes(file.type)
      ) {
        return `Invalid file type. Accepted types: ${mergedConfig.acceptedTypes.join(
          ', '
        )}`;
      }

      // Check file size
      if (mergedConfig.maxFileSize && file.size > mergedConfig.maxFileSize) {
        return `File too large. Maximum size: ${formatFileSize(
          mergedConfig.maxFileSize
        )}`;
      }

      return null;
    },
    [mergedConfig]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file
      const error = validateFile(file);
      if (error) {
        setUploadState({ status: 'error', progress: 0, error });
        onUploadError?.(new Error(error));
        return;
      }

      setSelectedFile(file);
      setUploadState({ status: 'uploading', progress: 0 });

      try {
        // Get presigned URL
        if (!onUploadStart) {
          throw new Error('onUploadStart handler not provided');
        }

        const { uploadUrl, videoId } = await onUploadStart(file);

        // Upload file using XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadState((prev) => ({ ...prev, progress }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));

          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        // Confirm upload
        setUploadState({ status: 'processing', progress: 100, videoId });

        if (onConfirmUpload) {
          await onConfirmUpload(videoId);
        }

        setUploadState({ status: 'ready', progress: 100, videoId });
        onUploadComplete?.(videoId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';
        setUploadState({ status: 'error', progress: 0, error: errorMessage });
        onUploadError?.(
          error instanceof Error ? error : new Error(errorMessage)
        );
      }
    },
    [
      validateFile,
      onUploadStart,
      onConfirmUpload,
      onUploadComplete,
      onUploadError,
    ]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploadState.status === 'uploading') return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, uploadState.status, handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && uploadState.status !== 'uploading') {
        setIsDragging(true);
      }
    },
    [disabled, uploadState.status]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && uploadState.status !== 'uploading') {
      fileInputRef.current?.click();
    }
  }, [disabled, uploadState.status]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setUploadState({ status: 'idle', progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [selectedFile, handleFileSelect]);

  const renderUploadArea = () => (
    <Box
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      sx={{
        p: 4,
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        backgroundColor: isDragging ? 'primary.50' : 'grey.50',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        opacity: disabled ? 0.5 : 1,
        '&:hover': !disabled
          ? {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50',
            }
          : {},
      }}
    >
      <CloudUploadIcon
        sx={{ fontSize: 64, color: isDragging ? 'primary.main' : 'grey.400' }}
      />
      <Typography variant="h6" sx={{ mt: 2, color: 'text.primary' }}>
        {isDragging ? 'Drop video here' : 'Drag & drop a video file'}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        or click to browse
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Chip
          size="small"
          label={`Max size: ${formatFileSize(mergedConfig.maxFileSize!)}`}
          sx={{ mr: 1 }}
        />
        <Chip
          size="small"
          label={`Max duration: ${formatDuration(mergedConfig.maxDuration!)}`}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{ mt: 1, display: 'block', color: 'text.disabled' }}
      >
        Supported formats: MP4, WebM, MOV, AVI
      </Typography>
    </Box>
  );

  const renderProgress = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <VideoFileIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" noWrap>
            {selectedFile?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedFile && formatFileSize(selectedFile.size)}
          </Typography>
        </Box>
        {uploadState.status !== 'uploading' && (
          <IconButton onClick={handleReset} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={uploadState.progress}
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {uploadState.status === 'uploading' &&
            `Uploading... ${uploadState.progress}%`}
          {uploadState.status === 'processing' && 'Processing video...'}
          {uploadState.status === 'ready' && 'Upload complete!'}
        </Typography>
        {uploadState.status === 'ready' && (
          <CheckCircleIcon sx={{ color: 'success.main' }} />
        )}
      </Box>
    </Paper>
  );

  const renderError = () => (
    <Alert
      severity="error"
      icon={<ErrorIcon />}
      action={
        <Box>
          <IconButton onClick={handleRetry} size="small" color="inherit">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={handleReset} size="small" color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>
      }
    >
      {uploadState.error}
    </Alert>
  );

  return (
    <Box className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={mergedConfig.acceptedTypes?.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {uploadState.status === 'idle' && renderUploadArea()}
      {(uploadState.status === 'uploading' ||
        uploadState.status === 'processing' ||
        uploadState.status === 'ready') &&
        renderProgress()}
      {uploadState.status === 'error' && renderError()}
    </Box>
  );
};

export default VideoUpload;
