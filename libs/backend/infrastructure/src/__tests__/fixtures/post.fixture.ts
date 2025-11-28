/**
 * Post Test Fixtures
 *
 * Factory functions for creating test post entities.
 */

import { PostEntity, PostStatus, PostVisibility } from '@blog/shared/domain';

let postCounter = 0;

/**
 * Options for creating a test post
 */
export interface CreateTestPostOptions {
  authorId: string;
  title?: string;
  content?: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  videoId?: string | null;
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private' | 'unlisted';
}

/**
 * Create a test post entity with optional overrides
 */
export function createTestPost(options: CreateTestPostOptions): PostEntity {
  postCounter++;
  const uniqueSuffix = `${Date.now()}_${postCounter}`;

  return PostEntity.create({
    authorId: options.authorId,
    title:
      options.title ??
      `Test Post Title ${uniqueSuffix} - This is a test post with enough characters`,
    content:
      options.content ??
      `This is the content of test post ${uniqueSuffix}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`,
    excerpt: options.excerpt,
    featuredImageUrl: options.featuredImageUrl,
    videoId: options.videoId,
    status: options.status ?? PostStatus.DRAFT,
    visibility: options.visibility ?? PostVisibility.PUBLIC,
  });
}

/**
 * Create a published post
 */
export function createTestPublishedPost(
  options: CreateTestPostOptions
): PostEntity {
  const post = createTestPost({
    ...options,
    status: PostStatus.PUBLISHED,
    visibility: PostVisibility.PUBLIC,
  });
  post.publish();
  return post;
}

/**
 * Create a draft post
 */
export function createTestDraftPost(
  options: CreateTestPostOptions
): PostEntity {
  return createTestPost({
    ...options,
    status: PostStatus.DRAFT,
  });
}

/**
 * Create an archived post
 */
export function createTestArchivedPost(
  options: CreateTestPostOptions
): PostEntity {
  const post = createTestPost(options);
  post.archive();
  return post;
}

/**
 * Create a private post
 */
export function createTestPrivatePost(
  options: CreateTestPostOptions
): PostEntity {
  return createTestPost({
    ...options,
    visibility: PostVisibility.PRIVATE,
  });
}

/**
 * Create an unlisted post
 */
export function createTestUnlistedPost(
  options: CreateTestPostOptions
): PostEntity {
  return createTestPost({
    ...options,
    visibility: PostVisibility.UNLISTED,
  });
}

/**
 * Create multiple test posts for the same author
 */
export function createTestPosts(
  count: number,
  options: CreateTestPostOptions
): PostEntity[] {
  return Array.from({ length: count }, () => createTestPost(options));
}

/**
 * Create posts with specific titles for search testing
 */
export function createTestPostsForSearch(
  authorId: string,
  titles: string[]
): PostEntity[] {
  return titles.map((title) =>
    createTestPost({
      authorId,
      title: title.length >= 10 ? title : `${title} - padding for min length`,
    })
  );
}

/**
 * Reset post counter (call in beforeEach for predictable slugs)
 */
export function resetPostCounter(): void {
  postCounter = 0;
}
