/**
 * Domain Events - Barrel Export
 *
 * Domain events represent something that happened in the domain.
 * They enable loose coupling between aggregates and support
 * eventual consistency in distributed systems.
 */

// Base
export {
  DomainEvent,
  AggregateRoot,
  type IEventEmitter,
} from './domain-event.base.js';

// User Events
export {
  UserRegisteredEvent,
  UserEmailVerifiedEvent,
  UserProfileUpdatedEvent,
  UserBlockedEvent,
  UserDeletedEvent,
} from './user.events.js';

// Post Events
export {
  PostCreatedEvent,
  PostPublishedEvent,
  PostUnpublishedEvent,
  PostUpdatedEvent,
  PostDeletedEvent,
  PostViewedEvent,
  PostLikedEvent,
  PostUnlikedEvent,
  PostEmbeddingGeneratedEvent,
} from './post.events.js';

// Comment Events
export {
  CommentCreatedEvent,
  CommentApprovedEvent,
  CommentFlaggedEvent,
  CommentHiddenEvent,
  CommentDeletedEvent,
} from './comment.events.js';

// Video Events
export {
  VideoUploadedEvent,
  VideoProcessingStartedEvent,
  VideoProcessingCompletedEvent,
  VideoProcessingFailedEvent,
  VideoDeletedEvent,
  VideoViewedEvent,
} from './video.events.js';
