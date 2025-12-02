/**
 * Repository Interfaces - Barrel Export
 *
 * Repository interfaces (Ports) define contracts for data persistence.
 * They are the boundary between domain and infrastructure layers.
 *
 * Implementations (Adapters) will be created in the infrastructure layer.
 */

// Entity Repositories
export type {
  IUserRepository,
  UserQueryOptions,
} from './user.repository.interface.js';
export type {
  IPostRepository,
  PostQueryOptions,
  PostFeedOptions,
  PostSearchOptions,
  TrendingOptions,
} from './post.repository.interface.js';
export type {
  ICategoryRepository,
  CategoryQueryOptions,
} from './category.repository.interface.js';
export type {
  ITagRepository,
  TagQueryOptions,
  TrendingTagOptions,
} from './tag.repository.interface.js';
export type {
  ICommentRepository,
  CommentQueryOptions,
  CommentModerationOptions,
} from './comment.repository.interface.js';
export type {
  IVideoRepository,
  VideoQueryOptions,
  VideoUpdateData,
} from './video.repository.interface.js';
export type { IVideoQualityRepository } from './video-quality.repository.interface.js';
export type { ISessionRepository } from './session.repository.interface.js';
export type {
  IFollowRepository,
  FollowQueryOptions,
} from './follow.repository.interface.js';
export type {
  IEmailVerificationTokenRepository,
  EmailVerificationToken,
  CreateEmailVerificationTokenInput,
} from './email-verification-token.repository.interface.js';
export type {
  IPasswordResetTokenRepository,
  PasswordResetToken,
  CreatePasswordResetTokenInput,
} from './password-reset-token.repository.interface.js';
export type {
  ILoginAttemptRepository,
  LoginAttempt,
  CreateLoginAttemptInput,
  LoginAttemptStats,
} from './login-attempt.repository.interface.js';
