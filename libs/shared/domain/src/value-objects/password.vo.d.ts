/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';
export declare class Password {
    private readonly value;
    private constructor();
    /**
     * Factory method to create a validated Password
     * @throws ZodError if validation fails
     */
    static create(password: string): Password;
    /**
     * Get the password value (for hashing)
     * Should only be used when hashing the password
     */
    getValue(): string;
    /**
     * Calculate password strength
     */
    getStrength(): PasswordStrength;
    /**
     * Check if password contains common patterns to avoid
     */
    hasCommonPatterns(): boolean;
    /**
     * Check equality with another Password
     */
    equals(other: Password): boolean;
    /**
     * String representation (masked for security)
     */
    toString(): string;
    /**
     * Prevent JSON serialization of password
     */
    toJSON(): string;
}
//# sourceMappingURL=password.vo.d.ts.map