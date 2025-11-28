/**
 * Route Types
 */

import type { RequestHandler } from 'express';
import type {
  IUserRepository,
  ISessionRepository,
  IPostRepository,
  IVideoRepository,
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
  authMiddleware: RequestHandler;
}

export interface VideoRoutesDependencies {
  videoRepository: IVideoRepository;
  authMiddleware: RequestHandler;
}
