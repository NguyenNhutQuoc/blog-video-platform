/**
 * Post Use Cases - Barrel Export
 */

export {
  CreatePostUseCase,
  type CreatePostInput,
  type CreatePostOutput,
  type CreatePostDependencies,
} from './create-post.use-case.js';

export {
  GetPostUseCase,
  type GetPostInput,
  type GetPostOutput,
  type GetPostDependencies,
} from './get-post.use-case.js';

export {
  UpdatePostUseCase,
  type UpdatePostInput,
  type UpdatePostOutput,
  type UpdatePostDependencies,
} from './update-post.use-case.js';

export {
  DeletePostUseCase,
  type DeletePostInput,
  type DeletePostOutput,
  type DeletePostDependencies,
} from './delete-post.use-case.js';

export {
  ListPostsUseCase,
  type ListPostsInput,
  type ListPostsOutput,
  type ListPostsDependencies,
  type PostSummary,
} from './list-posts.use-case.js';
