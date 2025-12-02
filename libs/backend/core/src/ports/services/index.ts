/**
 * Service Interfaces - Barrel Export
 */

export type { IPasswordHasher } from './password-hasher.interface.js';
export type {
  ITokenGenerator,
  TokenPayload,
  TokenPair,
} from './token-generator.interface.js';
export type {
  IEmailService,
  EmailOptions,
  SendEmailResult,
  VerificationEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
} from './email.service.interface.js';
export type {
  IStorageService,
  PresignedUrlOptions,
  PresignedUrlResult,
  UploadFileOptions,
  GetObjectOptions,
  DeleteObjectOptions,
  CopyObjectOptions,
  ObjectInfo,
  ListObjectsOptions,
  StorageBucket,
} from './storage.service.interface.js';
export { StorageBuckets } from './storage.service.interface.js';
export type {
  IVideoQueueService,
  EncodingJobData,
  JobStatus,
  JobResult,
} from './video-queue.service.interface.js';
export type {
  IFFmpegService,
  VideoMetadata,
  HLSQuality,
  HLSEncodingResult,
  EncodingProgressCallback,
} from './ffmpeg.service.interface.js';
export { DEFAULT_HLS_QUALITIES } from './ffmpeg.service.interface.js';
export type {
  INotificationService,
  VideoNotificationData,
} from './notification.service.interface.js';
export { NotificationType } from './notification.service.interface.js';
