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
  authMiddleware: RequestHandler;
}

export interface CategoryRoutesDependencies {
  categoryRepository: ICategoryRepository;
}

export interface TagRoutesDependencies {
  tagRepository: ITagRepository;
  authMiddleware: RequestHandler;
}
