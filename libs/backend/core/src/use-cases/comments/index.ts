/**
 * Comments Use Cases - Barrel Export
 */

export {
  CreateCommentUseCase,
  type CreateCommentInput,
  type CreateCommentOutput,
  type CreateCommentDependencies,
} from './create-comment.use-case.js';

export {
  DeleteCommentUseCase,
  type DeleteCommentInput,
  type DeleteCommentOutput,
  type DeleteCommentDependencies,
} from './delete-comment.use-case.js';

export {
  GetPostCommentsUseCase,
  type GetPostCommentsInput,
  type GetPostCommentsOutput,
  type GetPostCommentsDependencies,
  type CommentWithAuthor,
} from './get-post-comments.use-case.js';
