import { z } from 'zod';
/**
 * Video Entity - Video file with encoding status
 */
export declare const VideoStatus: {
    readonly UPLOADING: "uploading";
    readonly PROCESSING: "processing";
    readonly READY: "ready";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export declare const VideoQuality: {
    readonly Q1080P: "1080p";
    readonly Q720P: "720p";
    readonly Q480P: "480p";
    readonly Q360P: "360p";
};
export declare const VideoSchema: z.ZodObject<{
    id: z.ZodString;
    postId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    originalFilename: z.ZodString;
    fileSize: z.ZodNumber;
    mimeType: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        uploading: "uploading";
        processing: "processing";
        ready: "ready";
        failed: "failed";
        cancelled: "cancelled";
    }>>;
    duration: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    width: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    height: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    originalCodec: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    originalBitrate: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    rawFilePath: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    hlsMasterUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    thumbnailUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    availableQualities: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        "1080p": "1080p";
        "720p": "720p";
        "480p": "480p";
        "360p": "360p";
    }>>>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    errorMessage: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    uploadedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    processingCompletedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Request Upload URL DTO
 */
export declare const RequestUploadUrlDtoSchema: z.ZodObject<{
    filename: z.ZodString;
    fileSize: z.ZodNumber;
    mimeType: z.ZodString;
}, z.core.$strip>;
/**
 * Upload URL Response DTO
 */
export declare const UploadUrlResponseDtoSchema: z.ZodObject<{
    videoId: z.ZodString;
    uploadUrl: z.ZodString;
    expiresAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Confirm Upload DTO
 */
export declare const ConfirmUploadDtoSchema: z.ZodObject<{
    videoId: z.ZodString;
}, z.core.$strip>;
/**
 * Video Status Response DTO
 */
export declare const VideoStatusResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<{
        uploading: "uploading";
        processing: "processing";
        ready: "ready";
        failed: "failed";
        cancelled: "cancelled";
    }>;
    progress: z.ZodNullable<z.ZodNumber>;
    duration: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    thumbnailUrl: z.ZodNullable<z.ZodString>;
    hlsMasterUrl: z.ZodNullable<z.ZodString>;
    availableQualities: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        "1080p": "1080p";
        "720p": "720p";
        "480p": "480p";
        "360p": "360p";
    }>>>;
    errorMessage: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Video Response DTO (full details)
 */
export declare const VideoResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    status: z.ZodDefault<z.ZodEnum<{
        uploading: "uploading";
        processing: "processing";
        ready: "ready";
        failed: "failed";
        cancelled: "cancelled";
    }>>;
    postId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    fileSize: z.ZodNumber;
    duration: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    availableQualities: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        "1080p": "1080p";
        "720p": "720p";
        "480p": "480p";
        "360p": "360p";
    }>>>;
    retryCount: z.ZodDefault<z.ZodNumber>;
    originalFilename: z.ZodString;
    mimeType: z.ZodString;
    width: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    height: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    originalCodec: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    originalBitrate: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    hlsMasterUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    thumbnailUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    uploadedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    processingCompletedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export type Video = z.infer<typeof VideoSchema>;
export type RequestUploadUrlDto = z.infer<typeof RequestUploadUrlDtoSchema>;
export type UploadUrlResponseDto = z.infer<typeof UploadUrlResponseDtoSchema>;
export type ConfirmUploadDto = z.infer<typeof ConfirmUploadDtoSchema>;
export type VideoStatusResponseDto = z.infer<typeof VideoStatusResponseDtoSchema>;
export type VideoResponseDto = z.infer<typeof VideoResponseDtoSchema>;
export declare class VideoEntity {
    private readonly props;
    constructor(props: Video);
    get id(): string;
    get status(): string;
    get retryCount(): number;
    get isReady(): boolean;
    get isFailed(): boolean;
    /**
     * BR-04: Video only shows when status = 'ready'
     */
    canBeDisplayed(): boolean;
    /**
     * BR-04: Check if can retry encoding
     */
    canRetry(): boolean;
    /**
     * Mark as processing
     */
    startProcessing(): void;
    /**
     * Mark as ready (after successful encoding)
     */
    markAsReady(hlsMasterUrl: string, thumbnailUrl: string, qualities: string[]): void;
    /**
     * Mark as failed
     * BR-04: If retry_count >= 3, status = 'failed' permanently
     */
    markAsFailed(errorMessage: string): void;
    /**
     * Cancel upload/processing
     */
    cancel(): void;
    /**
     * BR-04: Check if raw file should be deleted (after successful encoding)
     */
    shouldDeleteRawFile(): boolean;
    /**
     * Delete raw file path (after cleanup)
     */
    clearRawFilePath(): void;
    /**
     * Get encoding progress (estimated based on status)
     */
    getProgress(): number;
    /**
     * Convert to status DTO (for polling)
     */
    toStatusDto(): VideoStatusResponseDto;
    /**
     * Serialize to JSON
     */
    toJSON(): Video;
}
//# sourceMappingURL=video.entity.d.ts.map