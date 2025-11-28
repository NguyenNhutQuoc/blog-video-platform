import { DomainEvent } from './domain-event.base.js';

/**
 * Comment Domain Events
 */

// =====================================================
// COMMENT CREATED
// =====================================================

export class CommentCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly postId: string,
    public readonly userId: string,
    public readonly parentId?: string
  ) {
    super(aggregateId, 'Comment');
  }

  get eventName(): string {
    return 'comment.created';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      postId: this.postId,
      userId: this.userId,
      parentId: this.parentId,
      isReply: !!this.parentId,
    };
  }
}

// =====================================================
// COMMENT APPROVED
// =====================================================

export class CommentApprovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly postId: string,
    public readonly moderatorId?: string
  ) {
    super(aggregateId, 'Comment');
  }

  get eventName(): string {
    return 'comment.approved';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      postId: this.postId,
      moderatorId: this.moderatorId,
    };
  }
}

// =====================================================
// COMMENT FLAGGED
// =====================================================

export class CommentFlaggedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly reason: string,
    public readonly flaggedBy?: string
  ) {
    super(aggregateId, 'Comment');
  }

  get eventName(): string {
    return 'comment.flagged';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      reason: this.reason,
      flaggedBy: this.flaggedBy,
    };
  }
}

// =====================================================
// COMMENT HIDDEN
// =====================================================

export class CommentHiddenEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly reason: string,
    public readonly moderatorId?: string
  ) {
    super(aggregateId, 'Comment');
  }

  get eventName(): string {
    return 'comment.hidden';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      reason: this.reason,
      moderatorId: this.moderatorId,
    };
  }
}

// =====================================================
// COMMENT DELETED
// =====================================================

export class CommentDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly postId: string,
    public readonly deletedBy: string
  ) {
    super(aggregateId, 'Comment');
  }

  get eventName(): string {
    return 'comment.deleted';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      postId: this.postId,
      deletedBy: this.deletedBy,
    };
  }
}
