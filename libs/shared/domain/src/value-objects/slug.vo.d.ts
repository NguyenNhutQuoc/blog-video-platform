export declare class Slug {
    private readonly value;
    private constructor();
    /**
     * Factory method to create a validated Slug
     * @throws ZodError if validation fails
     */
    static create(slug: string): Slug;
    /**
     * Create Slug from trusted source (e.g., database)
     * Skips validation for performance
     */
    static fromPersistence(slug: string): Slug;
    /**
     * Generate a slug from any text
     */
    static fromText(text: string): Slug;
    /**
     * Generate a unique slug by appending a suffix
     * Useful when slug already exists in database
     */
    withSuffix(suffix: string | number): Slug;
    /**
     * Generate a unique slug by appending timestamp
     */
    makeUnique(): Slug;
    /**
     * Get the slug value
     */
    getValue(): string;
    /**
     * Check equality with another Slug
     */
    equals(other: Slug): boolean;
    /**
     * String representation
     */
    toString(): string;
    /**
     * JSON serialization
     */
    toJSON(): string;
}
//# sourceMappingURL=slug.vo.d.ts.map