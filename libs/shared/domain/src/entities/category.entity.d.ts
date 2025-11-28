import { z } from 'zod';
export declare const CategorySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    postCount: z.ZodDefault<z.ZodNumber>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
/**
 * Create Category DTO
 */
export declare const CreateCategoryDtoSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodNullable<z.ZodString>>>;
    parentId: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Update Category DTO
 */
export declare const UpdateCategoryDtoSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodNullable<z.ZodString>>>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Category Response DTO (with children)
 */
export declare const CategoryResponseDtoSchema: z.ZodType<any>;
/**
 * Category Tree DTO (for navigation)
 */
export declare const CategoryTreeDtoSchema: z.ZodType<any>;
export type Category = z.infer<typeof CategorySchema>;
export type CategoryCreate = {
    name: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
    sortOrder?: number;
};
export type CategoryUpdate = Partial<Pick<Category, 'name' | 'slug' | 'description' | 'parentId' | 'sortOrder' | 'isActive'>>;
export type CreateCategoryDto = z.infer<typeof CreateCategoryDtoSchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDtoSchema>;
export type CategoryResponseDto = z.infer<typeof CategoryResponseDtoSchema>;
export type CategoryTreeDto = z.infer<typeof CategoryTreeDtoSchema>;
export declare class CategoryEntity {
    private readonly props;
    constructor(props: Category);
    get id(): string;
    get name(): string;
    get slug(): string;
    get description(): string | null;
    get parentId(): string | null;
    get postCount(): number;
    get sortOrder(): number;
    get isActive(): boolean;
    get isRoot(): boolean;
    static create(data: CategoryCreate): CategoryEntity;
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data: Category): CategoryEntity;
    /**
     * Generate slug from category name
     */
    static generateSlug(name: string): string;
    /**
     * Check if can be deleted (no posts assigned)
     */
    canBeDeleted(): boolean;
    /**
     * Check if category is displayable (active with posts)
     */
    isDisplayable(): boolean;
    /**
     * Update category details
     */
    update(data: CategoryUpdate): void;
    /**
     * Activate category
     */
    activate(): void;
    /**
     * Deactivate category
     */
    deactivate(): void;
    /**
     * Move to different parent
     */
    moveTo(parentId: string | null): void;
    /**
     * Increment post count
     */
    incrementPostCount(): void;
    /**
     * Decrement post count
     */
    decrementPostCount(): void;
    /**
     * Serialize to JSON
     */
    toJSON(): Category;
    /**
     * Serialize for navigation/tree
     */
    toTreeNode(): CategoryTreeDto;
    /**
     * Serialize for dropdown/select
     */
    toOption(): {
        value: string;
        label: string;
    };
}
//# sourceMappingURL=category.entity.d.ts.map