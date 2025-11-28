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
} from '@blog/backend/core';

export interface AuthRoutesDependencies {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  authMiddleware: RequestHandler;
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
