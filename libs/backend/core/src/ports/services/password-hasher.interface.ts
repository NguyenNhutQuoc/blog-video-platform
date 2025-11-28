/**
 * Password Hasher Interface (Port)
 *
 * Defines the contract for password hashing operations.
 * Implementation will use bcrypt.
 */
export interface IPasswordHasher {
  /**
   * Hash a plain text password
   */
  hash(password: string): Promise<string>;

  /**
   * Compare a plain text password with a hash
   */
  compare(password: string, hash: string): Promise<boolean>;
}
