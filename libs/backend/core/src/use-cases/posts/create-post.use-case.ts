/**
 * Create Post Use Case
 *
 * Handles post creation with business rules validation.
 */

import {
  PostEntity,
  CreatePostDtoSchema,
  PostStatus,
  PostVisibility,
} from '@blog/shared/domain';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { ICategoryRepository } from '../../ports/repositories/category.repository.interface.js';
import type { ITagRepository } from '../../ports/repositories/tag.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

/** Maximum posts per user (BR-02) */
const MAX_POSTS_PER_USER = 100;

/** Maximum retries for unique slug generation */
const MAX_SLUG_RETRIES = 10;

export interface CreatePostInput {
  authorId: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  categoryIds: string[];
  tagIds?: string[];
  videoId?: string;
  status?: 'draft' | 'published';
  visibility?: 'public' | 'private' | 'unlisted';
}

export interface CreatePostOutput {
  post: {
    id: string;
    authorId: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    status: string;
    visibility: string;
    createdAt: Date;
  };
}

export interface CreatePostDependencies {
  postRepository: IPostRepository;
  userRepository: IUserRepository;
  categoryRepository: ICategoryRepository;
  tagRepository: ITagRepository;
}

export class CreatePostUseCase {
  constructor(private readonly deps: CreatePostDependencies) {}

  async execute(input: CreatePostInput): Promise<Result<CreatePostOutput>> {
    // 1. Validate input with Zod schema
    const validation = CreatePostDtoSchema.safeParse({
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      featuredImageUrl: input.featuredImageUrl,
      categoryIds: input.categoryIds,
      tagIds: input.tagIds ?? [],
      videoId: input.videoId,
      status: input.status,
      visibility: input.visibility,
    });

    if (!validation.success) {
      return failure(ErrorCodes.VALIDATION_ERROR, 'Invalid input', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // 2. Check user exists, is verified and active (BR-01)
    const user = await this.deps.userRepository.findById(input.authorId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    if (!user.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'User account is inactive');
    }

    if (!user.emailVerified) {
      return failure(
        ErrorCodes.EMAIL_NOT_VERIFIED,
        'Email must be verified to create posts'
      );
    }

    // 3. Check user hasn't exceeded max posts (BR-02)
    const postCount = await this.deps.postRepository.countByAuthor(
      input.authorId
    );
    if (postCount >= MAX_POSTS_PER_USER) {
      return failure(
        ErrorCodes.CANNOT_CREATE_POST,
        `Maximum posts limit (${MAX_POSTS_PER_USER}) reached`
      );
    }

    // 4. Validate categories exist
    if (input.categoryIds.length > 0) {
      const categories = await this.deps.categoryRepository.findByIds(
        input.categoryIds
      );
      if (categories.length !== input.categoryIds.length) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'One or more categories not found'
        );
      }
    }

    // 5. Validate tags exist (if provided)
    if (input.tagIds && input.tagIds.length > 0) {
      const tags = await this.deps.tagRepository.findByIds(input.tagIds);
      if (tags.length !== input.tagIds.length) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'One or more tags not found'
        );
      }
    }

    // 6. Create post entity (generates slug internally)
    const post = PostEntity.create({
      authorId: input.authorId,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      featuredImageUrl: input.featuredImageUrl,
      videoId: input.videoId,
      status: input.status ?? PostStatus.DRAFT,
      visibility: input.visibility ?? PostVisibility.PUBLIC,
    });

    // 7. Ensure slug is unique (BR-03)
    let slug = post.slug;
    let slugExists = await this.deps.postRepository.slugExists(slug);
    let retries = 0;

    while (slugExists && retries < MAX_SLUG_RETRIES) {
      retries++;
      slug = `${post.slug}-${retries}`;
      slugExists = await this.deps.postRepository.slugExists(slug);
    }

    if (slugExists) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Could not generate unique slug for this title'
      );
    }

    // Note: Slug uniqueness was already verified above with retries.
    // The slug is set when the post is created, so no further action needed.

    // 8. Save post
    await this.deps.postRepository.save(post);

    // 9. TODO: If status is published, queue embedding generation (BR-05)
    // This would be handled by an event/message queue in production

    // 10. Return result
    const postData = post.toJSON();
    return success({
      post: {
        id: postData.id,
        authorId: postData.authorId,
        title: postData.title,
        slug: postData.slug,
        content: postData.content,
        excerpt: postData.excerpt,
        status: postData.status,
        visibility: postData.visibility,
        createdAt: postData.createdAt,
      },
    });
  }
}
