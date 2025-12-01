// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Auth tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

// Auth user (simpler version returned from login/register)
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
}

// Post types
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  videoId?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  author: User;
  categories: Category[];
  tags: Tag[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  tags?: { name: string }[];
  published?: boolean;
  visibility?: 'public' | 'private' | 'unlisted';
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string;
  likeCount: number;
  status: 'approved' | 'pending' | 'spam';
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  postCount: number;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

// Follow types
export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Author summary (embedded in PostSummary)
export interface AuthorSummary {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}

// Post summary (for list views - matches backend PostSummary)
export interface PostSummary {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  createdAt: string;
  author: AuthorSummary;
}

// Cursor-based pagination response (generic)
export interface CursorPaginatedResponse<T> {
  data: T[];
  posts?: T[]; // Backward compatibility for posts endpoint
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// List filters (cursor-based)
export interface PostFilters {
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private' | 'unlisted';
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  cursor?: string;
  limit?: number;
  orderBy?: 'publishedAt' | 'viewCount' | 'likeCount';
  orderDir?: 'asc' | 'desc';
}
