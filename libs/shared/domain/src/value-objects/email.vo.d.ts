export declare class Email {
    private readonly value;
    private constructor();
    /**
     * Factory method to create a validated Email
     * @throws ZodError if validation fails
     */
    static create(email: string): Email;
    /**
     * Create Email from trusted source (e.g., database)
     * Skips validation for performance
     */
    static fromPersistence(email: string): Email;
    /**
     * Get the email value
     */
    getValue(): string;
    /**
     * Get the domain part of the email
     */
    getDomain(): string;
    /**
     * Get the local part of the email (before @)
     */
    getLocalPart(): string;
    /**
     * Check equality with another Email
     */
    equals(other: Email): boolean;
    /**
     * String representation
     */
    toString(): string;
    /**
     * JSON serialization
     */
    toJSON(): string;
}
//# sourceMappingURL=email.vo.d.ts.map