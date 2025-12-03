import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useForgotPassword } from '@blog/shared-data-access';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data.email);
      setEmailSent(true);
    } catch (error) {
      console.error('Forgot password failed:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your email and we'll send you instructions to reset your
            password
          </Typography>
        </Box>

        {emailSent ? (
          <Box textAlign="center">
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset instructions have been sent to{' '}
              <strong>{getValues('email')}</strong>
            </Alert>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Please check your email and follow the instructions to reset your
              password.
            </Typography>
            <Link to="/auth/login" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<ArrowBack />}>
                Back to Sign In
              </Button>
            </Link>
          </Box>
        ) : (
          <>
            {forgotPasswordMutation.isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {(forgotPasswordMutation.error as any)?.response?.data
                  ?.message || 'Failed to send reset email. Please try again.'}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box mb={3}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      autoComplete="email"
                    />
                  )}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={forgotPasswordMutation.isPending}
                sx={{ mb: 3, py: 1.5, fontWeight: 600 }}
              >
                {forgotPasswordMutation.isPending
                  ? 'Sending...'
                  : 'Send Reset Link'}
              </Button>

              <Box textAlign="center">
                <Link to="/auth/login" style={{ textDecoration: 'none' }}>
                  <Button variant="text" startIcon={<ArrowBack />}>
                    Back to Sign In
                  </Button>
                </Link>
              </Box>
            </form>
          </>
        )}
      </Paper>
    </Container>
  );
}
