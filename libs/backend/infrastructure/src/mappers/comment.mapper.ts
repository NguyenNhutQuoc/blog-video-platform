/**
 * Comment Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type {
  CommentRow,
  NewComment,
  CommentUpdate,
} from '../database/types.js';
import { CommentEntity, type Comment } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseCommentRow {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isFlagged: boolean;
  likeCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
}

/**
 * Map database row to domain entity
 */
export function toDomainComment(row: CommentRow): CommentEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseCommentRow;

  const comment: Comment = {
    id: camelRow.id,
    postId: camelRow.postId,
    userId: camelRow.userId,
    parentId: camelRow.parentId,
    content: camelRow.content,
    isFlagged: camelRow.isFlagged,
    likeCount: camelRow.likeCount ?? 0,
    status: camelRow.status as 'approved' | 'pending_review' | 'hidden',
    createdAt: camelRow.createdAt,
    updatedAt: camelRow.updatedAt,
    deletedAt: camelRow.deletedAt,
    deletedBy: camelRow.deletedBy,
  };

  return CommentEntity.fromPersistence(comment);
}

/**
 * Map domain entity to database insert row
 */
export function toNewCommentRow(entity: CommentEntity): NewComment {
  const data = entity.toJSON();
  return {
    id: data.id,
    post_id: data.postId,
    user_id: data.userId,
    parent_id: data.parentId,
    content: data.content,
    is_flagged: data.isFlagged,
    status: data.status,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
    deleted_at: data.deletedAt,
    deleted_by: data.deletedBy,
  };
}

/**
 * Map domain entity to database update row
 */
export function toCommentUpdateRow(entity: CommentEntity): CommentUpdate {
  const data = entity.toJSON();
  return {
    content: data.content,
    is_flagged: data.isFlagged,
    status: data.status,
    updated_at: new Date(),
    deleted_at: data.deletedAt,
    deleted_by: data.deletedBy,
  };
}
