/**
 * Value Objects - Barrel Export
 *
 * Value Objects are immutable domain primitives that:
 * - Encapsulate validation logic
 * - Have no identity (compared by value, not reference)
 * - Are side-effect free
 */

export { Email } from './email.vo.js';
export { Username } from './username.vo.js';
export { Password, type PasswordStrength } from './password.vo.js';
export { Slug } from './slug.vo.js';
