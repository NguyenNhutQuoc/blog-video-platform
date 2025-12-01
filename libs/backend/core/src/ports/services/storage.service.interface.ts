/**
 * Storage Service Interface
 *
 * Port interface for object storage operations (MinIO/S3-compatible)
 */

export interface PresignedUrlOptions {
  /** Bucket name */
  bucket: string;
  /** Object key (file path) */
  key: string;
  /** URL expiration time in seconds (default: 3600 = 1 hour) */
  expiresIn?: number;
  /** Content type for upload URLs */
  contentType?: string;
}

export interface UploadFileOptions {
  /** Bucket name */
  bucket: string;
  /** Object key (file path) */
  key: string;
  /** File buffer or stream */
  data: Buffer | import('stream').Readable;
  /** Content type */
  contentType: string;
  /** Optional metadata */
  metadata?: Record<string, string>;
}

export interface GetObjectOptions {
  /** Bucket name */
  bucket: string;
  /** Object key (file path) */
  key: string;
}

export interface DeleteObjectOptions {
  /** Bucket name */
  bucket: string;
  /** Object key (file path) */
  key: string;
}

export interface CopyObjectOptions {
  /** Source bucket */
  sourceBucket: string;
  /** Source key */
  sourceKey: string;
  /** Destination bucket */
  destBucket: string;
  /** Destination key */
  destKey: string;
}

export interface ObjectInfo {
  /** Object key */
  key: string;
  /** Object size in bytes */
  size: number;
  /** Last modified date */
  lastModified: Date;
  /** ETag */
  etag: string;
  /** Content type */
  contentType?: string;
}

export interface ListObjectsOptions {
  /** Bucket name */
  bucket: string;
  /** Prefix filter */
  prefix?: string;
  /** Maximum number of objects to return */
  maxKeys?: number;
}

export interface PresignedUrlResult {
  /** The presigned URL */
  url: string;
  /** Expiration time */
  expiresAt: Date;
}

/**
 * Storage Service Port
 *
 * Defines the contract for object storage operations.
 * Implemented by MinIO, AWS S3, or other S3-compatible services.
 */
export interface IStorageService {
  /**
   * Generate a presigned URL for uploading an object
   */
  generatePresignedUploadUrl(
    options: PresignedUrlOptions
  ): Promise<PresignedUrlResult>;

  /**
   * Generate a presigned URL for downloading an object
   */
  generatePresignedDownloadUrl(
    options: PresignedUrlOptions
  ): Promise<PresignedUrlResult>;

  /**
   * Upload a file to storage
   */
  uploadFile(options: UploadFileOptions): Promise<ObjectInfo>;

  /**
   * Get object as a readable stream
   */
  getObjectStream(options: GetObjectOptions): Promise<NodeJS.ReadableStream>;

  /**
   * Get object as buffer
   */
  getObjectBuffer(options: GetObjectOptions): Promise<Buffer>;

  /**
   * Delete an object
   */
  deleteObject(options: DeleteObjectOptions): Promise<void>;

  /**
   * Delete multiple objects
   */
  deleteObjects(bucket: string, keys: string[]): Promise<void>;

  /**
   * Copy an object
   */
  copyObject(options: CopyObjectOptions): Promise<ObjectInfo>;

  /**
   * List objects in a bucket
   */
  listObjects(options: ListObjectsOptions): Promise<ObjectInfo[]>;

  /**
   * Check if an object exists
   */
  objectExists(options: GetObjectOptions): Promise<boolean>;

  /**
   * Get object metadata/info
   */
  getObjectInfo(options: GetObjectOptions): Promise<ObjectInfo>;

  /**
   * Get public URL for an object (if bucket is public)
   */
  getPublicUrl(bucket: string, key: string): string;

  /**
   * Check if storage service is configured and ready
   */
  isConfigured(): boolean;
}

/**
 * Bucket names for the application
 */
export const StorageBuckets = {
  /** Raw uploaded videos (private) */
  VIDEOS_RAW: 'videos-raw',
  /** Encoded HLS videos (public-read) */
  VIDEOS_ENCODED: 'videos-encoded',
  /** Video thumbnails (public-read) */
  THUMBNAILS: 'thumbnails',
  /** User uploaded images (public-read) */
  IMAGES: 'images',
} as const;

export type StorageBucket =
  (typeof StorageBuckets)[keyof typeof StorageBuckets];
