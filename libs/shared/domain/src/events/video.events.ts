import { DomainEvent } from './domain-event.base.js';

/**
 * Video Domain Events
 */

// =====================================================
// VIDEO UPLOADED
// =====================================================

export class VideoUploadedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly uploaderId: string,
    public readonly filename: string,
    public readonly fileSize: number
  ) {
    super(aggregateId, 'Video');
  }

  get eventName(): string {
    return 'video.uploaded';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      uploaderId: this.uploaderId,
      filename: this.filename,
      fileSize: this.fileSize,
    };
  }
}

// =====================================================
// VIDEO PROCESSING STARTED
// =====================================================

export class VideoProcessingStartedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId, 'Video');
  }

  get eventName(): string {
    return 'video.processing_started';
  }

  protected getPayload(): Record<string, unknown> {
    return {};
  }
}

// =====================================================
// VIDEO PROCESSING COMPLETED
// =====================================================

export class VideoProcessingCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly duration: number,
    public readonly qualities: string[]
  ) {
    super(aggregateId, 'Video');
  }

  get eventName(): string {
    return 'video.processing_completed';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      duration: this.duration,
      qualities: this.qualities,
    };
  }
}

// =====================================================
// VIDEO PROCESSING FAILED
// =====================================================

export class VideoProcessingFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly error: string,
    public readonly retryCount: number
  ) {
    super(aggregateId, 'Video');
  }

  get eventName(): string {
    return 'video.processing_failed';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      error: this.error,
      retryCount: this.retryCount,
    };
  }
}

// =====================================================
// VIDEO DELETED
// =====================================================

export class VideoDeletedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly uploaderId: string) {
    super(aggregateId, 'Video');
  }

  get eventName(): string {
    return 'video.deleted';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      uploaderId: this.uploaderId,
    };
  }
}

// =====================================================
// VIDEO VIEWED
// =====================================================

export class VideoViewedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly viewerId?: string,
    public readonly watchDuration?: number
  ) {
    super(aggregateId, 'Video');
  }

  get eventName(): string {
    return 'video.viewed';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      viewerId: this.viewerId,
      watchDuration: this.watchDuration,
    };
  }
}
