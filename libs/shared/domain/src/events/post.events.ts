import { DomainEvent } from './domain-event.base.js';

/**
 * Post Domain Events
 */

// =====================================================
// POST CREATED
// =====================================================

export class PostCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly slug: string
  ) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.created';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      authorId: this.authorId,
      title: this.title,
      slug: this.slug,
    };
  }
}

// =====================================================
// POST PUBLISHED
// =====================================================

export class PostPublishedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly slug: string
  ) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.published';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      authorId: this.authorId,
      title: this.title,
      slug: this.slug,
    };
  }
}

// =====================================================
// POST UNPUBLISHED
// =====================================================

export class PostUnpublishedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly reason?: string) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.unpublished';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      reason: this.reason,
    };
  }
}

// =====================================================
// POST UPDATED
// =====================================================

export class PostUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly changes: Record<string, unknown>
  ) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.updated';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      changes: this.changes,
    };
  }
}

// =====================================================
// POST DELETED
// =====================================================

export class PostDeletedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly authorId: string) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.deleted';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      authorId: this.authorId,
    };
  }
}

// =====================================================
// POST VIEWED
// =====================================================

export class PostViewedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly viewerId?: string,
    public readonly ipAddress?: string
  ) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.viewed';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      viewerId: this.viewerId,
      ipAddress: this.ipAddress,
    };
  }
}

// =====================================================
// POST LIKED
// =====================================================

export class PostLikedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly userId: string) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.liked';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
    };
  }
}

// =====================================================
// POST UNLIKED
// =====================================================

export class PostUnlikedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly userId: string) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.unliked';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
    };
  }
}

// =====================================================
// POST EMBEDDING GENERATED
// =====================================================

export class PostEmbeddingGeneratedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId, 'Post');
  }

  get eventName(): string {
    return 'post.embedding_generated';
  }

  protected getPayload(): Record<string, unknown> {
    return {};
  }
}
