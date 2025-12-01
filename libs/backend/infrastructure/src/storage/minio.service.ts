/**
 * MinIO Storage Service Implementation
 *
 * S3-compatible object storage using MinIO SDK.
 * Provides presigned URLs for direct upload/download, file operations, and bucket management.
 */

import { Client } from 'minio';
import type { BucketItem } from 'minio';
import { Readable } from 'stream';
import type {
  IStorageService,
  PresignedUrlOptions,
  PresignedUrlResult,
  UploadFileOptions,
  GetObjectOptions,
  DeleteObjectOptions,
  CopyObjectOptions,
  ObjectInfo,
  ListObjectsOptions,
} from '@blog/backend/core';

export interface MinIOServiceConfig {
  /** MinIO server endpoint (e.g., 'localhost' or 'minio') */
  endPoint: string;
  /** MinIO server port (default: 9000) */
  port: number;
  /** Use SSL/TLS (default: false for local dev) */
  useSSL: boolean;
  /** Access key (username) */
  accessKey: string;
  /** Secret key (password) */
  secretKey: string;
  /** Public URL for accessing objects (e.g., 'http://localhost:9000') */
  publicUrl?: string;
}

export class MinIOService implements IStorageService {
  private client: Client;
  private config: MinIOServiceConfig;
  private initialized = false;

  constructor(config: MinIOServiceConfig) {
    this.config = config;
    this.client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
  }

  /**
   * Initialize the service and ensure buckets exist
   */
  async initialize(): Promise<void> {
    try {
      // Verify connection by listing buckets
      await this.client.listBuckets();
      this.initialized = true;
      console.log('📦 MinIO Service: Connected successfully');
    } catch (error) {
      console.error('❌ MinIO Service: Connection failed', error);
      throw error;
    }
  }

  /**
   * Ensure a bucket exists, create if not
   */
  async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
      console.log(`📦 MinIO: Created bucket '${bucket}'`);
    }
  }

  isConfigured(): boolean {
    return this.initialized;
  }

  async generatePresignedUploadUrl(
    options: PresignedUrlOptions
  ): Promise<PresignedUrlResult> {
    const expiresIn = options.expiresIn || 3600; // 1 hour default

    // Ensure bucket exists
    await this.ensureBucket(options.bucket);

    const url = await this.client.presignedPutObject(
      options.bucket,
      options.key,
      expiresIn
    );

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { url, expiresAt };
  }

  async generatePresignedDownloadUrl(
    options: PresignedUrlOptions
  ): Promise<PresignedUrlResult> {
    const expiresIn = options.expiresIn || 3600; // 1 hour default

    const url = await this.client.presignedGetObject(
      options.bucket,
      options.key,
      expiresIn
    );

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { url, expiresAt };
  }

  async uploadFile(options: UploadFileOptions): Promise<ObjectInfo> {
    // Ensure bucket exists
    await this.ensureBucket(options.bucket);

    const metadata = {
      'Content-Type': options.contentType,
      ...options.metadata,
    };

    if (Buffer.isBuffer(options.data)) {
      await this.client.putObject(
        options.bucket,
        options.key,
        options.data,
        options.data.length,
        metadata
      );
    } else {
      // Handle Node.js Readable stream
      const stream = options.data as Readable;
      await this.client.putObject(
        options.bucket,
        options.key,
        stream,
        undefined,
        metadata
      );
    }

    // Get the uploaded object info
    return this.getObjectInfo({ bucket: options.bucket, key: options.key });
  }

  async getObjectStream(
    options: GetObjectOptions
  ): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(options.bucket, options.key);
  }

  async getObjectBuffer(options: GetObjectOptions): Promise<Buffer> {
    const stream = await this.getObjectStream(options);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteObject(options: DeleteObjectOptions): Promise<void> {
    await this.client.removeObject(options.bucket, options.key);
  }

  async deleteObjects(bucket: string, keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const objectsList = keys.map((key) => ({ name: key }));
    await this.client.removeObjects(bucket, objectsList);
  }

  async copyObject(options: CopyObjectOptions): Promise<ObjectInfo> {
    // Ensure destination bucket exists
    await this.ensureBucket(options.destBucket);

    await this.client.copyObject(
      options.destBucket,
      options.destKey,
      `/${options.sourceBucket}/${options.sourceKey}`,
      null as unknown as import('minio').CopyConditions
    );

    return this.getObjectInfo({
      bucket: options.destBucket,
      key: options.destKey,
    });
  }

  async listObjects(options: ListObjectsOptions): Promise<ObjectInfo[]> {
    const objects: ObjectInfo[] = [];
    const stream = this.client.listObjectsV2(
      options.bucket,
      options.prefix || '',
      true
    );

    return new Promise((resolve, reject) => {
      let count = 0;
      const maxKeys = options.maxKeys || 1000;

      stream.on('data', (obj: BucketItem) => {
        if (count >= maxKeys) return;

        if (obj.name) {
          objects.push({
            key: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag,
          });
          count++;
        }
      });

      stream.on('end', () => resolve(objects));
      stream.on('error', reject);
    });
  }

  async objectExists(options: GetObjectOptions): Promise<boolean> {
    try {
      await this.client.statObject(options.bucket, options.key);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'NotFound'
      ) {
        return false;
      }
      throw error;
    }
  }

  async getObjectInfo(options: GetObjectOptions): Promise<ObjectInfo> {
    const stat = await this.client.statObject(options.bucket, options.key);

    return {
      key: options.key,
      size: stat.size,
      lastModified: stat.lastModified,
      etag: stat.etag,
      contentType: stat.metaData?.['content-type'] || undefined,
    };
  }

  getPublicUrl(bucket: string, key: string): string {
    const baseUrl =
      this.config.publicUrl ||
      `http${this.config.useSSL ? 's' : ''}://${this.config.endPoint}:${
        this.config.port
      }`;
    return `${baseUrl}/${bucket}/${key}`;
  }

  /**
   * Download file to a local path
   */
  async downloadToFile(
    bucket: string,
    key: string,
    filePath: string
  ): Promise<void> {
    await this.client.fGetObject(bucket, key, filePath);
  }

  /**
   * Upload file from a local path
   */
  async uploadFromFile(
    bucket: string,
    key: string,
    filePath: string,
    contentType: string
  ): Promise<ObjectInfo> {
    await this.ensureBucket(bucket);

    await this.client.fPutObject(bucket, key, filePath, {
      'Content-Type': contentType,
    });

    return this.getObjectInfo({ bucket, key });
  }
}

/**
 * Create and initialize MinIO service
 */
export async function createMinIOService(
  config: MinIOServiceConfig
): Promise<MinIOService> {
  const service = new MinIOService(config);
  await service.initialize();
  return service;
}
