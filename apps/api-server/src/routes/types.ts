/**
 * Route Types
 */

import type { RequestHandler } from 'express';
import type {
  IUserRepository,
  ISessionRepository,
  IPostRepository,
  IVideoRepository,
  ICategoryRepository,
  ITagRepository,
  IFollowRepository,
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
  authMiddleware: RequestHandler;
  optionalAuthMiddleware: RequestHandler;
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
  userRepository: IUserRepository;
  storageService: IStorageService;
  videoQueueService?: IVideoQueueService; // For real-time progress tracking
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
