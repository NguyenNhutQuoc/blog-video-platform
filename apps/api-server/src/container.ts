/**
 * Dependency Injection Container
 *
 * Creates and wires all dependencies for the application.
 */

import type { Kysely } from 'kysely';
import type { Pool } from 'pg';
import type { Database } from '@blog/backend/infrastructure';
import type {
  IUserRepository,
  IPostRepository,
  ISessionRepository,
  ICategoryRepository,
  ITagRepository,
  IFollowRepository,
  IVideoRepository,
  IEmailVerificationTokenRepository,
  IPasswordResetTokenRepository,
  ILoginAttemptRepository,
  IPasswordHasher,
  ITokenGenerator,
  IEmailService,
  IStorageService,
  IVideoQueueService,
} from '@blog/backend/core';
import {
  PostgresUserRepository,
  PostgresPostRepository,
  PostgresSessionRepository,
  PostgresCategoryRepository,
  PostgresTagRepository,
  PostgresFollowRepository,
  PostgresVideoRepository,
  EmailVerificationTokenRepository,
  PasswordResetTokenRepository,
  LoginAttemptRepository,
} from '@blog/backend/infrastructure';
import type { Env } from './config/env.js';

/**
 * Application Container
 *
 * Contains all dependencies used throughout the application.
 */
export interface AppContainer {
  // Repositories
  userRepository: IUserRepository;
  postRepository: IPostRepository;
  sessionRepository: ISessionRepository;
  categoryRepository: ICategoryRepository;
  tagRepository: ITagRepository;
  followRepository: IFollowRepository;
  videoRepository: IVideoRepository;
  emailVerificationTokenRepository: IEmailVerificationTokenRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  loginAttemptRepository: ILoginAttemptRepository;

  // Services
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  emailService?: IEmailService;
  storageService?: IStorageService;
  videoQueueService?: IVideoQueueService;

  // Video processing queue function
  queueVideoForProcessing?: (
    videoId: string,
    rawFilePath: string
  ) => Promise<string>;

  // Middleware factories will be created in app.ts
  // as they depend on tokenGenerator

  // Configuration
  env: Env;
}

export interface ContainerDependencies {
  db: Kysely<Database>;
  pool: Pool;
  env: Env;
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  emailService?: IEmailService;
  storageService?: IStorageService;
  videoQueueService?: IVideoQueueService;
  queueVideoForProcessing?: (
    videoId: string,
    rawFilePath: string
  ) => Promise<string>;
}

/**
 * Create the application container with all dependencies
 */
export function createContainer(deps: ContainerDependencies): AppContainer {
  // Initialize repositories
  const userRepository = new PostgresUserRepository(deps.db);
  const postRepository = new PostgresPostRepository(deps.db);
  const sessionRepository = new PostgresSessionRepository(deps.db);
  const categoryRepository = new PostgresCategoryRepository(deps.db);
  const tagRepository = new PostgresTagRepository(deps.db);
  const followRepository = new PostgresFollowRepository(deps.db);
  const videoRepository = new PostgresVideoRepository(deps.db);
  const emailVerificationTokenRepository = new EmailVerificationTokenRepository(
    deps.pool
  );
  const passwordResetTokenRepository = new PasswordResetTokenRepository(
    deps.pool
  );
  const loginAttemptRepository = new LoginAttemptRepository(deps.pool);

  return {
    // Repositories
    userRepository,
    postRepository,
    sessionRepository,
    categoryRepository,
    tagRepository,
    followRepository,
    videoRepository,
    emailVerificationTokenRepository,
    passwordResetTokenRepository,
    loginAttemptRepository,

    // Services
    passwordHasher: deps.passwordHasher,
    tokenGenerator: deps.tokenGenerator,
    emailService: deps.emailService,
    storageService: deps.storageService,
    videoQueueService: deps.videoQueueService,
    queueVideoForProcessing: deps.queueVideoForProcessing,

    // Configuration
    env: deps.env,
  };
}
