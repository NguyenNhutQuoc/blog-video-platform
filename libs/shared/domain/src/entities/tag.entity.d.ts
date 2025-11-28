import { z } from 'zod';
export declare const TagSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    usageCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Create Tag DTO
 */
export declare const CreateTagDtoSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Update Tag DTO
 */
export declare const UpdateTagDtoSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Tag Response DTO
 */
export declare const TagResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    usageCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Popular Tags DTO
 */
export declare const PopularTagsDtoSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    usageCount: z.ZodNumber;
}, z.core.$strip>>;
export type Tag = z.infer<typeof TagSchema>;
export type TagCreate = {
    name: string;
    slug?: string;
};
export type TagUpdate = Partial<Pick<Tag, 'name' | 'slug'>>;
export type CreateTagDto = z.infer<typeof CreateTagDtoSchema>;
export type UpdateTagDto = z.infer<typeof UpdateTagDtoSchema>;
export type TagResponseDto = z.infer<typeof TagResponseDtoSchema>;
export type PopularTagsDto = z.infer<typeof PopularTagsDtoSchema>;
export declare class TagEntity {
    private readonly props;
    constructor(props: Tag);
    get id(): string;
    get name(): string;
    get slug(): string;
    get usageCount(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(data: TagCreate): TagEntity;
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data: Tag): TagEntity;
    /**
     * Generate slug from tag name
     */
    static generateSlug(name: string): string;
    /**
     * Check if can be deleted (not used by any posts)
     */
    canBeDeleted(): boolean;
    /**
     * Check if tag is trending (high usage)
     */
    isTrending(threshold?: number): boolean;
    /**
     * Normalize tag name for comparison
     */
    static normalize(name: string): string;
    /**
     * Check if two tag names are equivalent
     */
    static areEquivalent(name1: string, name2: string): boolean;
    /**
     * Update tag details
     */
    update(data: TagUpdate): void;
    /**
     * Rename tag
     */
    rename(newName: string): void;
    /**
     * Increment usage count
     */
    incrementUsageCount(): void;
    /**
     * Decrement usage count
     */
    decrementUsageCount(): void;
    /**
     * Serialize to JSON
     */
    toJSON(): Tag;
    /**
     * Serialize for autocomplete/dropdown
     */
    toOption(): {
        value: string;
        label: string;
    };
    /**
     * Serialize for tag cloud
     */
    toCloudItem(): {
        name: string;
        slug: string;
        count: number;
    };
}
//# sourceMappingURL=tag.entity.d.ts.map