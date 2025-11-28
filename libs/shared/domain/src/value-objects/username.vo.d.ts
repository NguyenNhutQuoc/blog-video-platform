export declare class Username {
    private readonly value;
    private constructor();
    /**
     * Factory method to create a validated Username
     * @throws ZodError if validation fails
     */
    static create(username: string): Username;
    /**
     * Create Username from trusted source (e.g., database)
     * Skips validation for performance
     */
    static fromPersistence(username: string): Username;
    /**
     * Check if username is reserved
     */
    static isReserved(username: string): boolean;
    /**
     * Get the username value
     */
    getValue(): string;
    /**
     * Check equality with another Username
     */
    equals(other: Username): boolean;
    /**
     * String representation
     */
    toString(): string;
    /**
     * JSON serialization
     */
    toJSON(): string;
}
//# sourceMappingURL=username.vo.d.ts.map