/**
 * Bcrypt Password Hasher
 *
 * Implementation of IPasswordHasher using bcrypt.
 */

import bcrypt from 'bcrypt';
import type { IPasswordHasher } from '@blog/backend/core';

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly saltRounds: number = SALT_ROUNDS) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

/**
 * Create a singleton instance of the password hasher
 */
export function createPasswordHasher(saltRounds?: number): IPasswordHasher {
  return new BcryptPasswordHasher(saltRounds);
}
