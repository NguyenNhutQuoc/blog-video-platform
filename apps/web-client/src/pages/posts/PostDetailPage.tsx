import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Stack,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Collapse,
} from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  BookmarkBorder,
  Bookmark,
  MoreVert,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  NavigationBar,
  UserProfileCard,
  CommentCard,
  VideoPlayer,
} from '@blog/shared-ui-kit';
import { useAuth } from '../../providers/AuthProvider';
import {
  usePost,
  usePostComments,
  useCommentReplies,
  useCreateComment,
  useDeleteComment,
  useLikePost,
  useUnlikePost,
  useLikeComment,
  useUnlikeComment,
  Comment,
  CursorPaginatedResponse,
} from '@blog/shared-data-access';
import { formatDate } from '@blog/shared-utils';

const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be under 500 characters'),
});

type CommentFormData = z.infer<typeof commentSchema>;

// Component to display a comment with its replies
interface CommentWithRepliesProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  onReplyClick: (commentId: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  onLikeComment: (commentId: string, isLiked: boolean) => void;
}

function CommentWithReplies({
  comment,
  postId,
  currentUserId,
  onReplyClick,
  replyingTo,
  onCancelReply,
  onLikeComment,
}: CommentWithRepliesProps) {
  const [showReplies, setShowReplies] = useState(false);
  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
  } = useCommentReplies(postId, showReplies ? comment.id : '');
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  console.log('Replies data for comment', comment);

  const onSubmitReply = async (data: CommentFormData) => {
    try {
      await createCommentMutation.mutateAsync({
        postId,
        content: data.content,
        parentId: comment.id,
      });
      reset();
      onCancelReply();
      setShowReplies(true);
    } catch (error) {
      console.error('Create reply failed:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteCommentMutation.mutateAsync({
          commentId: comment.id,
          postId,
        });
      } catch (error) {
        console.error('Delete comment failed:', error);
      }
    }
  };

  const replies = repliesData?.pages.flatMap((page) => page.data) ?? [];
  const isShowingReplyForm = replyingTo === comment.id;
  const canDelete = currentUserId === comment.author.id;

  return (
    <Box>
      <CommentCard
        id={comment.id}
        content={comment.content}
        author={{
          username: comment.author.username,
          fullName: comment.author.fullName || comment.author.username,
          avatarUrl: comment.author.avatarUrl || undefined,
        }}
        createdAt={comment.createdAt}
        likeCount={comment.likeCount}
        isLiked={comment.isLiked}
        onLike={() => onLikeComment(comment.id, comment.isLiked ?? false)}
        onReply={() => onReplyClick(comment.id)}
      />

      {/* Reply Form */}
      <Collapse in={isShowingReplyForm}>
        <Box sx={{ ml: 6, mt: 1, mb: 2 }}>
          <form onSubmit={handleSubmit(onSubmitReply)}>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder={`Reply to @${comment.author.username}...`}
                  error={!!errors.content}
                  helperText={errors.content?.message}
                  sx={{ mb: 1 }}
                />
              )}
            />
            <Stack direction="row" spacing={1}>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={createCommentMutation.isPending}
              >
                {createCommentMutation.isPending ? 'Posting...' : 'Reply'}
              </Button>
              <Button size="small" onClick={onCancelReply}>
                Cancel
              </Button>
            </Stack>
          </form>
        </Box>
      </Collapse>

      {/* Show/Hide Replies Toggle */}
      {comment.replyCount > 0 && (
        <Box sx={{ ml: 6 }}>
          <Button
            size="small"
            startIcon={showReplies ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowReplies(!showReplies)}
            sx={{ textTransform: 'none' }}
          >
            {showReplies ? 'Hide' : 'View'} {comment.replyCount}{' '}
            {comment.replyCount === 1 ? 'reply' : 'replies'}
          </Button>
        </Box>
      )}

      {/* Replies List */}
      <Collapse in={showReplies}>
        <Box
          sx={{ ml: 6, borderLeft: '2px solid', borderColor: 'divider', pl: 2 }}
        >
          {replies.map((reply) => (
            <Box key={reply.id} sx={{ py: 1 }}>
              <CommentCard
                id={reply.id}
                content={reply.content}
                author={{
                  username: reply.author.username,
                  fullName: reply.author.fullName || reply.author.username,
                  avatarUrl: reply.author.avatarUrl || undefined,
                }}
                createdAt={reply.createdAt}
                likeCount={reply.likeCount}
                isLiked={reply.isLiked}
                onLike={() => onLikeComment(reply.id, reply.isLiked ?? false)}
              />
              {currentUserId === reply.author.id && (
                <Button
                  size="small"
                  color="error"
                  sx={{ ml: 6, mt: -1 }}
                  onClick={() => {
                    if (window.confirm('Delete this reply?')) {
                      deleteCommentMutation.mutate({
                        commentId: reply.id,
                        postId,
                      });
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </Box>
          ))}
          {hasNextPage && (
            <Button size="small" onClick={() => fetchNextPage()}>
              Load more replies
            </Button>
          )}
        </Box>
      </Collapse>

      {/* Delete button for comment owner */}
      {canDelete && (
        <Box sx={{ ml: 6 }}>
          <Button
            size="small"
            color="error"
            onClick={handleDelete}
            disabled={deleteCommentMutation.isPending}
          >
            Delete
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const postId = params.id as string;

  const { data: post, isLoading: postLoading } = usePost(postId);
  console.log('Post data:', post);
  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
  } = usePostComments(postId);
  const createCommentMutation = useCreateComment();
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const likeCommentMutation = useLikeComment();
  const unlikeCommentMutation = useUnlikeComment();

  console.log('Comments data:', commentsData);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  });

  // Use isLiked from post data (from API)
  const isLiked = post?.isLiked ?? false;
  const isBookmarked = false; // TODO: Implement bookmarked state from API

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikePostMutation.mutateAsync(postId);
      } else {
        await likePostMutation.mutateAsync(postId);
      }
    } catch (error) {
      console.error('Like action failed:', error);
    }
  };

  const handleLikeComment = async (
    commentId: string,
    isCommentLiked: boolean
  ) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    try {
      if (isCommentLiked) {
        await unlikeCommentMutation.mutateAsync({ commentId, postId });
      } else {
        await likeCommentMutation.mutateAsync({ commentId, postId });
      }
    } catch (error) {
      console.error('Comment like action failed:', error);
    }
  };

  const onSubmitComment = async (data: CommentFormData) => {
    try {
      await createCommentMutation.mutateAsync({
        postId,
        content: data.content,
      });
      reset();
    } catch (error) {
      console.error('Create comment failed:', error);
    }
  };

  const handleReplyClick = (commentId: string) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (postLoading) {
    return (
      <>
        <NavigationBar
          user={user || undefined}
          notificationCount={0}
          onProfileClick={() => user && navigate(`/users/${user.username}`)}
          onLoginClick={() => navigate('/auth/login')}
          onCreatePostClick={() => navigate('/posts/new')}
          onLogoutClick={handleLogout}
        />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <NavigationBar
          user={user || undefined}
          notificationCount={0}
          onProfileClick={() => user && navigate(`/users/${user.username}`)}
          onLoginClick={() => navigate('/auth/login')}
          onCreatePostClick={() => navigate('/posts/new')}
          onLogoutClick={handleLogout}
        />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Typography variant="h5" textAlign="center">
            Post not found
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavigationBar
        user={user || undefined}
        notificationCount={0}
        onProfileClick={() => user && navigate(`/users/${user.username}`)}
        onLoginClick={() => navigate('/auth/login')}
        onCreatePostClick={() => navigate('/posts/new')}
        onLogoutClick={handleLogout}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Post Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={3}
          >
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Published {formatDate(post.createdAt)}
              </Typography>
            </Box>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => setAnchorEl(null)}>Report</MenuItem>
              {user?.id === post.author?.id && (
                <>
                  <MenuItem onClick={() => navigate(`/posts/${postId}/edit`)}>
                    Edit
                  </MenuItem>
                  <MenuItem onClick={() => setAnchorEl(null)}>Delete</MenuItem>
                </>
              )}
            </Menu>
          </Box>

          {/* Author Info */}
          <Box mb={3}>
            <UserProfileCard
              username={post.author?.username}
              fullName={post.author?.fullName}
              bio={post.author?.bio || ''}
              avatarUrl={post.author?.avatarUrl}
              postsCount={0}
              followersCount={0}
              followingCount={0}
            />
          </Box>

          {/* Video Player (if post has video) */}
          {post.video && post.video.hlsUrl && (
            <Box mb={3}>
              <VideoPlayer
                src={post.video.hlsUrl}
                poster={
                  post.video.thumbnailUrl ?? post.featuredImageUrl ?? undefined
                }
                title={post.title}
                onError={(error: Error) => console.error('Video error:', error)}
              />
              {post.video.duration && (
                <Typography variant="caption" color="text.secondary" mt={1}>
                  Duration: {Math.floor(post.video.duration / 60)}:
                  {(post.video.duration % 60).toString().padStart(2, '0')}
                </Typography>
              )}
            </Box>
          )}

          {/* Featured Image (only if no video) */}
          {!post.video?.hlsUrl && post.featuredImageUrl && (
            <Box
              component="img"
              src={post.featuredImageUrl}
              alt={post.title}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 500,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 3,
              }}
            />
          )}

          {/* Post Content - render HTML from TipTap */}
          <Box
            sx={{
              mb: 3,
              lineHeight: 1.8,
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                mt: 3,
                mb: 2,
                fontWeight: 700,
              },
              '& h1': { fontSize: '2rem' },
              '& h2': { fontSize: '1.5rem' },
              '& h3': { fontSize: '1.25rem' },
              '& p': { mb: 2 },
              '& ul, & ol': { pl: 3, mb: 2 },
              '& li': { mb: 1 },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                pl: 2,
                ml: 0,
                fontStyle: 'italic',
                color: 'text.secondary',
              },
              '& code': {
                bgcolor: 'grey.100',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontFamily: 'monospace',
              },
              '& pre': {
                bgcolor: 'grey.900',
                color: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
              '& hr': {
                my: 3,
                border: 'none',
                borderTop: '1px solid',
                borderColor: 'divider',
              },
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" gap={1}>
              {post.tags.map(
                (tag: { id: string; name: string; slug: string }) => (
                  <Typography
                    key={tag.id}
                    variant="body2"
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 20,
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      fontWeight: 500,
                    }}
                  >
                    #{tag.name}
                  </Typography>
                )
              )}
            </Stack>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Actions */}
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
              onClick={handleLike}
              color={isLiked ? 'error' : 'inherit'}
            >
              {post.likeCount} Likes
            </Button>
            <Button
              startIcon={isBookmarked ? <Bookmark /> : <BookmarkBorder />}
            >
              Bookmark
            </Button>
          </Stack>
        </Paper>

        {/* Comments Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Comments ({post.commentCount})
          </Typography>

          {/* Add Comment Form */}
          {user ? (
            <Box mb={4}>
              <form onSubmit={handleSubmit(onSubmitComment)}>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Write a comment..."
                      error={!!errors.content}
                      helperText={errors.content?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={createCommentMutation.isPending}
                >
                  {createCommentMutation.isPending
                    ? 'Posting...'
                    : 'Post Comment'}
                </Button>
              </form>
            </Box>
          ) : (
            <Box
              mb={4}
              textAlign="center"
              py={3}
              bgcolor="grey.50"
              borderRadius={2}
            >
              <Typography variant="body2" color="text.secondary" mb={2}>
                Sign in to leave a comment
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/auth/login')}
              >
                Sign In
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Comments List */}
          <Stack spacing={2} divider={<Divider />}>
            {commentsData?.pages
              .flatMap((page: any) => {
                console.log('Comments page data:', page);
                return page || [];
              })
              .filter((comment): comment is Comment => comment != null)
              .map((comment: Comment) => (
                <CommentWithReplies
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  currentUserId={user?.id}
                  onReplyClick={handleReplyClick}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  onLikeComment={handleLikeComment}
                />
              ))}
            {!commentsData?.pages[0] && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                py={4}
              >
                No comments yet. Be the first to comment!
              </Typography>
            )}
          </Stack>

          {/* Load More Comments */}
          {hasNextPage && (
            <Box textAlign="center" mt={3}>
              <Button onClick={() => fetchNextPage()}>
                Load more comments
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
}
