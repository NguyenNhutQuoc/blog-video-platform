'use client';

import { Suspense } from 'react';
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
  Paper,
  CircularProgress,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { NavigationBar } from '@blog/shared-ui-kit';
import { useAuth } from '../../../providers/AuthProvider';
import { useState } from 'react';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function ChangePasswordContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      // TODO: Implement password change API call
      // await changePasswordMutation.mutateAsync({
      //   currentPassword: data.currentPassword,
      //   newPassword: data.newPassword,
      // });

      console.log('Password change data:', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      alert('Password changed successfully! Please log in again.');
      reset();
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Change password failed:', error);
      alert('Failed to change password. Please check your current password.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    router.push('/auth/login');
    return null;
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
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box mb={3} display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => router.push('/settings')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Change Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Update your password to keep your account secure
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3} mb={4}>
              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Current Password *
                </Typography>
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      error={!!errors.currentPassword}
                      helperText={errors.currentPassword?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              edge="end"
                            >
                              {showCurrentPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  New Password *
                </Typography>
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      error={!!errors.newPassword}
                      helperText={
                        errors.newPassword?.message ||
                        'Must be 8+ characters with uppercase, lowercase, and number'
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              edge="end"
                            >
                              {showNewPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={500} mb={1}>
                  Confirm New Password *
                </Typography>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => router.push('/settings')}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" fullWidth>
                Change Password
              </Button>
            </Stack>
          </form>

          <Box mt={4} p={2} bgcolor="grey.50" borderRadius={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> After changing your password, you will be
              logged out and need to sign in again with your new password.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}
