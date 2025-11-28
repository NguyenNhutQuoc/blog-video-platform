import { z } from 'zod';
/**
 * Session Entity - User authentication sessions
 *
 * Represents an active user session with JWT tokens.
 * Supports refresh token rotation and device tracking.
 */
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    refreshToken: z.ZodString;
    userAgent: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    ipAddress: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    deviceName: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    lastActiveAt: z.ZodDate;
    expiresAt: z.ZodDate;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export declare const CreateSessionDtoSchema: z.ZodObject<{
    userId: z.ZodString;
    userAgent: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const SessionResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    deviceName: z.ZodNullable<z.ZodString>;
    lastActiveAt: z.ZodDate;
    createdAt: z.ZodDate;
    isCurrent: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
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
export declare class SessionEntity {
    private readonly props;
    constructor(props: Session);
    get id(): string;
    get userId(): string;
    get refreshToken(): string;
    get userAgent(): string | null;
    get ipAddress(): string | null;
    get deviceName(): string | null;
    get lastActiveAt(): Date;
    get expiresAt(): Date;
    get createdAt(): Date;
    static create(data: SessionCreate): SessionEntity;
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data: Session): SessionEntity;
    /**
     * Check if session is expired
     */
    isExpired(): boolean;
    /**
     * Check if session is valid
     */
    isValid(): boolean;
    /**
     * Check if session is stale (no activity for X days)
     */
    isStale(days?: number): boolean;
    /**
     * Parse device name from user agent
     */
    static parseDeviceName(userAgent: string | null): string | null;
    /**
     * Update last active timestamp
     */
    touch(): void;
    /**
     * Rotate refresh token
     */
    rotateToken(newToken: string): void;
    /**
     * Extend session expiration
     */
    extend(days?: number): void;
    /**
     * Serialize to JSON
     */
    toJSON(): Session;
    /**
     * Serialize for user session list (hide token)
     */
    toResponse(currentSessionId?: string): SessionResponseDto;
}
//# sourceMappingURL=session.entity.d.ts.map