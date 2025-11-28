import { z } from 'zod';

/**
 * Session Entity - User authentication sessions
 *
 * Represents an active user session with JWT tokens.
 * Supports refresh token rotation and device tracking.
 */

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  refreshToken: z.string().min(32), // Hashed token
  userAgent: z.string().max(500).nullable().default(null),
  ipAddress: z.string().max(45).nullable().default(null), // IPv6 max length
  deviceName: z.string().max(100).nullable().default(null),
  lastActiveAt: z.date(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

export const CreateSessionDtoSchema = z.object({
  userId: z.string().uuid(),
  userAgent: z.string().max(500).optional(),
  ipAddress: z.string().max(45).optional(),
});

export const SessionResponseDtoSchema = z.object({
  id: z.string().uuid(),
  deviceName: z.string().nullable(),
  lastActiveAt: z.date(),
  createdAt: z.date(),
  isCurrent: z.boolean().optional(),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Session = z.infer<typeof SessionSchema>;
export type SessionCreate = {
  userId: string;
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresInDays?: number;
};
export type CreateSessionDto = z.infer<typeof CreateSessionDtoSchema>;
export type SessionResponseDto = z.infer<typeof SessionResponseDtoSchema>;

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_SESSION_DURATION_DAYS = 30;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class SessionEntity {
  constructor(private readonly props: Session) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get refreshToken(): string {
    return this.props.refreshToken;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get deviceName(): string | null {
    return this.props.deviceName;
  }

  get lastActiveAt(): Date {
    return this.props.lastActiveAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Factory method
  static create(data: SessionCreate): SessionEntity {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(
      expiresAt.getDate() +
        (data.expiresInDays ?? DEFAULT_SESSION_DURATION_DAYS)
    );

    const session: Session = {
      id: crypto.randomUUID(),
      userId: data.userId,
      refreshToken: data.refreshToken,
      userAgent: data.userAgent ?? null,
      ipAddress: data.ipAddress ?? null,
      deviceName: SessionEntity.parseDeviceName(data.userAgent ?? null),
      lastActiveAt: now,
      expiresAt,
      createdAt: now,
    };

    // Validate
    SessionSchema.parse(session);

    return new SessionEntity(session);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: Session): SessionEntity {
    return new SessionEntity(data);
  }

  // Business Rules

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if session is valid
   */
  isValid(): boolean {
    return !this.isExpired();
  }

  /**
   * Check if session is stale (no activity for X days)
   */
  isStale(days = 7): boolean {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - days);
    return this.props.lastActiveAt < staleDate;
  }

  /**
   * Parse device name from user agent
   */
  static parseDeviceName(userAgent: string | null): string | null {
    if (!userAgent) return null;

    // Simple device detection
    if (userAgent.includes('Mobile')) {
      if (userAgent.includes('iPhone')) return 'iPhone';
      if (userAgent.includes('iPad')) return 'iPad';
      if (userAgent.includes('Android')) return 'Android Device';
      return 'Mobile Device';
    }

    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux PC';

    return 'Unknown Device';
  }

  // Mutations

  /**
   * Update last active timestamp
   */
  touch(): void {
    this.props.lastActiveAt = new Date();
  }

  /**
   * Rotate refresh token
   */
  rotateToken(newToken: string): void {
    this.props.refreshToken = newToken;
    this.props.lastActiveAt = new Date();
  }

  /**
   * Extend session expiration
   */
  extend(days = DEFAULT_SESSION_DURATION_DAYS): void {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    this.props.expiresAt = expiresAt;
    this.props.lastActiveAt = new Date();
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): Session {
    return { ...this.props };
  }

  /**
   * Serialize for user session list (hide token)
   */
  toResponse(currentSessionId?: string): SessionResponseDto {
    return {
      id: this.props.id,
      deviceName: this.props.deviceName,
      lastActiveAt: this.props.lastActiveAt,
      createdAt: this.props.createdAt,
      isCurrent: currentSessionId === this.props.id,
    };
  }
}
