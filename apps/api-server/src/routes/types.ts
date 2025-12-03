/**
 * Route Types
 */

import type { RequestHandler } from 'express';
import type {
  IUserRepository,
  ISessionRepository,
  IPostRepository,
  IVideoRepository,
  IVideoQualityRepository,
  ICategoryRepository,
  ITagRepository,
  IFollowRepository,
  ILikeRepository,
  ICommentRepository,
  ICommentLikeRepository,
  IPasswordHasher,
  ITokenGenerator,
  IEmailVerificationTokenRepository,
  IPasswordResetTokenRepository,
  ILoginAttemptRepository,
  IEmailService,
  IStorageService,
  IVideoQueueService,
} from '@blog/backend/core';

export interface AuthRoutesDependencies {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  authMiddleware: RequestHandler;
  // Optional - for email verification & password reset
  emailVerificationTokenRepository?: IEmailVerificationTokenRepository;
  passwordResetTokenRepository?: IPasswordResetTokenRepository;
  loginAttemptRepository?: ILoginAttemptRepository;
  emailService?: IEmailService;
  appUrl?: string;
}

export interface PostRoutesDependencies {
  postRepository: IPostRepository;
  userRepository: IUserRepository;
  categoryRepository: ICategoryRepository;
  tagRepository: ITagRepository;
  likeRepository: ILikeRepository;
  authMiddleware: RequestHandler;
  optionalAuthMiddleware: RequestHandler;
}

export interface CommentRoutesDependencies {
  commentRepository: ICommentRepository;
  commentLikeRepository: ICommentLikeRepository;
  postRepository: IPostRepository;
  userRepository: IUserRepository;
  authMiddleware: RequestHandler;
  optionalAuthMiddleware: RequestHandler;
  /** Redis config for comment rate limiting */
  redisConfig?: {
    host: string;
    port: number;
    password?: string;
  };
}

export interface UserRoutesDependencies {
  userRepository: IUserRepository;
  postRepository: IPostRepository;
  followRepository: IFollowRepository;
  authMiddleware: RequestHandler;
  optionalAuthMiddleware: RequestHandler;
}

export interface FollowRoutesDependencies {
  followRepository: IFollowRepository;
  userRepository: IUserRepository;
  authMiddleware: RequestHandler;
  optionalAuthMiddleware: RequestHandler;
}

export interface VideoRoutesDependencies {
  videoRepository: IVideoRepository;
  videoQualityRepository: IVideoQualityRepository;
  userRepository: IUserRepository;
  storageService: IStorageService;
  videoQueueService: IVideoQueueService;
  authMiddleware: RequestHandler;
  /**
   * Function to queue video for encoding
   * Provided by infrastructure layer (BullMQ)
   */
  queueVideoForProcessing: (
    videoId: string,
    rawFilePath: string
  ) => Promise<string>;
}

export interface CategoryRoutesDependencies {
  categoryRepository: ICategoryRepository;
}

export interface TagRoutesDependencies {
  tagRepository: ITagRepository;
  authMiddleware: RequestHandler;
}
