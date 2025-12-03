import { useNavigate } from 'react-router-dom';
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
  Stack,
  Divider,
  Avatar,
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { NavigationBar } from '@blog/shared-ui-kit';
import { useAuth } from '../../providers/AuthProvider';
import { useUpdateProfile } from '@blog/shared-data-access';

const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name too long'),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
  github: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || '',
      website: user?.socialLinks?.website || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: data.fullName,
        bio: data.bio || undefined,
        avatarUrl: data.avatarUrl || undefined,
        socialLinks: {
          twitter: data.twitter || undefined,
          github: data.github || undefined,
          website: data.website || undefined,
        },
      });

      // Refresh user data in AuthProvider
      await refreshUser?.();

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update profile failed:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleCancel = () => {
    reset();
  };

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  return (
    <>
      <NavigationBar
        user={user}
        notificationCount={0}
        onProfileClick={() => navigate(`/users/${user.username}`)}
        onLoginClick={() => navigate('/auth/login')}
        onCreatePostClick={() => navigate('/posts/new')}
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
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Manage your profile information and preferences
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Avatar Section */}
            <Box mb={4} display="flex" alignItems="center" gap={3}>
              <Avatar
                src={user.avatarUrl}
                alt={user.fullName}
                sx={{ width: 100, height: 100 }}
              />
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Profile Picture
                </Typography>
                <Controller
                  name="avatarUrl"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="https://example.com/avatar.jpg"
                      error={!!errors.avatarUrl}
                      helperText={errors.avatarUrl?.message}
                      size="small"
                    />
                  )}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Basic Information */}
            <Typography variant="h6" fontWeight={600} mb={3}>
              Basic Information
            </Typography>

            <Stack spacing={3} mb={4}>
              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Username
                </Typography>
                <TextField
                  fullWidth
                  value={user.username}
                  disabled
                  helperText="Username cannot be changed"
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  value={user.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Full Name *
                </Typography>
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="John Doe"
                      error={!!errors.fullName}
                      helperText={errors.fullName?.message}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Bio
                </Typography>
                <Controller
                  name="bio"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Tell us about yourself..."
                      error={!!errors.bio}
                      helperText={
                        errors.bio?.message ||
                        `${field.value?.length || 0}/500 characters`
                      }
                    />
                  )}
                />
              </Box>
            </Stack>

            <Divider sx={{ mb: 4 }} />

            {/* Social Links */}
            <Typography variant="h6" fontWeight={600} mb={3}>
              Social Links
            </Typography>

            <Stack spacing={3} mb={4}>
              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Twitter
                </Typography>
                <Controller
                  name="twitter"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="@username"
                      error={!!errors.twitter}
                      helperText={errors.twitter?.message}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  GitHub
                </Typography>
                <Controller
                  name="github"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="username"
                      error={!!errors.github}
                      helperText={errors.github?.message}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Website
                </Typography>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="https://yourwebsite.com"
                      error={!!errors.website}
                      helperText={errors.website?.message}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Divider sx={{ mb: 4 }} />

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={!isDirty || updateProfileMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={!isDirty || updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 4 }} />

          {/* Additional Settings */}
          <Box>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Account Settings
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/settings/password')}
              fullWidth
              sx={{ mb: 2 }}
            >
              Change Password
            </Button>
            <Typography variant="body2" color="text.secondary" mt={4}>
              Account created: {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
