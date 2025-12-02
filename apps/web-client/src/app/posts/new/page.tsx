'use client';

import { useState, useCallback } from 'react';
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
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  NavigationBar,
  RichTextEditor,
  VideoUpload,
  VideoUploadSuccess,
} from '@blog/shared-ui-kit';
import { useAuth } from '../../../providers/AuthProvider';
import {
  useCreatePost,
  useCategories,
  useTags,
  useVideoUpload,
  type Category,
  type Tag,
} from '@blog/shared-data-access';

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
  featuredImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
  visibility: z.enum(['public', 'private', 'unlisted']),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

export default function CreatePostPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const createPostMutation = useCreatePost();

  // Category and Tag data
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: tags = [], isLoading: tagsLoading } = useTags();

  // Selected categories and tags (store full objects for display)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Video upload state
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [uploadedVideoMeta, setUploadedVideoMeta] = useState<{
    filename: string;
    fileSize: number;
  } | null>(null);
  const { generateUploadUrl, confirmUpload, isGeneratingUrl, isConfirming } =
    useVideoUpload();

  // Video upload handlers
  const handleVideoUploadStart = useCallback(
    async (file: File) => {
      // Store file metadata for display later
      setUploadedVideoMeta({
        filename: file.name,
        fileSize: file.size,
      });

      const result = await generateUploadUrl({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
      return {
        uploadUrl: result.uploadUrl,
        videoId: result.videoId,
      };
    },
    [generateUploadUrl]
  );

  const handleVideoConfirmUpload = useCallback(
    async (videoId: string) => {
      await confirmUpload(videoId);
      setUploadedVideoId(videoId);
    },
    [confirmUpload]
  );

  const handleVideoUploadComplete = useCallback((videoId: string) => {
    console.log('Video upload complete:', videoId);
  }, []);

  const handleVideoUploadError = useCallback((error: Error) => {
    console.error('Video upload error:', error);
  }, []);

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
      featuredImageUrl: '',
      status: 'draft',
      visibility: 'public',
    },
  });

  const onSubmit = async (data: CreatePostFormData) => {
    try {
      await createPostMutation.mutateAsync({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || undefined,
        featuredImageUrl: data.featuredImageUrl || undefined,
        categoryIds: selectedCategories.map((c) => c.id),
        tagIds: selectedTags.map((t) => t.id),
        status: data.status,
        visibility: data.visibility,
        videoId: uploadedVideoId || undefined,
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

            {/* Video Upload Section */}
            <Box mb={3}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Video (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Upload a video to include with your post. Supported formats:
                MP4, WebM, MOV.
              </Typography>

              {!uploadedVideoId && (
                <VideoUpload
                  onUploadStart={handleVideoUploadStart}
                  onUploadComplete={handleVideoUploadComplete}
                  onUploadError={handleVideoUploadError}
                  onConfirmUpload={handleVideoConfirmUpload}
                  disabled={isGeneratingUrl || isConfirming}
                  config={{
                    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
                    maxDuration: 30 * 60, // 30 minutes
                  }}
                />
              )}

              {uploadedVideoId && (
                <VideoUploadSuccess
                  videoId={uploadedVideoId}
                  filename={uploadedVideoMeta?.filename}
                  fileSize={uploadedVideoMeta?.fileSize}
                  onRemove={() => {
                    setUploadedVideoId(null);
                    setUploadedVideoMeta(null);
                  }}
                  showDetails
                />
              )}
              <Divider sx={{ my: 3 }} />
            </Box>

            {/* Category Selection */}
            <Box mb={3}>
              <Autocomplete
                multiple
                options={categories}
                getOptionLabel={(option) => option.name}
                value={selectedCategories}
                onChange={(_, newValue) => setSelectedCategories(newValue)}
                loading={categoriesLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categories *"
                    placeholder="Select categories..."
                    helperText="At least one category is required"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {categoriesLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        {...tagProps}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Box>

            {/* Tag Selection */}
            <Box mb={3}>
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={(option) => option.name}
                value={selectedTags}
                onChange={(_, newValue) => {
                  // Limit to 5 tags
                  if (newValue.length <= 5) {
                    setSelectedTags(newValue);
                  }
                }}
                loading={tagsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags (Optional)"
                    placeholder="Select up to 5 tags..."
                    helperText={`${selectedTags.length}/5 tags selected`}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {tagsLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        {...tagProps}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={selectedTags.length >= 5}
              />
            </Box>

            <Box mb={4}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="published">Published</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Visibility</InputLabel>
                      <Select {...field} label="Visibility">
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                        <MenuItem value="unlisted">Unlisted</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Stack>
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
