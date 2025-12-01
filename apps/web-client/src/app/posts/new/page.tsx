'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { NavigationBar, RichTextEditor } from '@blog/shared-ui-kit';
import { useAuth } from '../../../providers/AuthProvider';
import { useCreatePost } from '@blog/shared-data-access';

const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  excerpt: z
    .string()
    .max(300, 'Excerpt must be less than 300 characters')
    .optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.string().optional(),
  featuredImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  published: z.boolean(),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

export default function CreatePostPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const createPostMutation = useCreatePost();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      tags: '',
      featuredImageUrl: '',
      published: false,
    },
  });

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = async (data: CreatePostFormData) => {
    try {
      await createPostMutation.mutateAsync({
        ...data,
        tags: tags.map((name) => ({ name })),
        excerpt: data.excerpt || undefined,
        featuredImageUrl: data.featuredImageUrl || undefined,
      });
      router.push('/');
    } catch (error) {
      console.error('Create post failed:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    return (
      <>
        <NavigationBar
          user={undefined}
          notificationCount={0}
          onLoginClick={() => router.push('/auth/login')}
        />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="warning">Please sign in to create a post.</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavigationBar
        user={user}
        notificationCount={0}
        onProfileClick={() => router.push(`/users/${user.username}`)}
        onLoginClick={() => router.push('/auth/login')}
        onCreatePostClick={() => router.push('/posts/new')}
        onLogoutClick={handleLogout}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Create New Post
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Share your thoughts with the community
          </Typography>

          {createPostMutation.isError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {(createPostMutation.error as any)?.response?.data?.message ||
                'Failed to create post. Please try again.'}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box mb={3}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Title"
                    placeholder="Enter post title..."
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Box>

            <Box mb={3}>
              <Controller
                name="excerpt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Excerpt (Optional)"
                    placeholder="Brief summary of your post..."
                    multiline
                    rows={2}
                    error={!!errors.excerpt}
                    helperText={
                      errors.excerpt?.message ||
                      'A short description that appears in the post preview'
                    }
                  />
                )}
              />
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Content *
              </Typography>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <Box>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Write your post content here..."
                      error={!!errors.content}
                    />
                    {errors.content && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        {errors.content.message}
                      </Typography>
                    )}
                  </Box>
                )}
              />
            </Box>

            <Box mb={3}>
              <Controller
                name="featuredImageUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Featured Image URL (Optional)"
                    placeholder="https://example.com/image.jpg"
                    error={!!errors.featuredImageUrl}
                    helperText={errors.featuredImageUrl?.message}
                  />
                )}
              />
            </Box>

            <Box mb={3}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Tags (Maximum 5)
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  size="small"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={tags.length >= 5}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  disabled={tags.length >= 5 || !tagInput.trim()}
                >
                  Add Tag
                </Button>
              </Box>
              {tags.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <Box mb={4}>
              <Controller
                name="published"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Publish immediately
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          If disabled, post will be saved as draft
                        </Typography>
                      </Box>
                    }
                  />
                )}
              />
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={createPostMutation.isPending}
                sx={{ fontWeight: 600 }}
              >
                {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </>
  );
}
