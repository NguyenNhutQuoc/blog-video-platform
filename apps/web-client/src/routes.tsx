import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(
  () => import('./pages/auth/ForgotPasswordPage')
);
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const CreatePostPage = lazy(() => import('./pages/posts/CreatePostPage'));
const PostDetailPage = lazy(() => import('./pages/posts/PostDetailPage'));
const UserProfilePage = lazy(() => import('./pages/users/UserProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ChangePasswordPage = lazy(
  () => import('./pages/settings/ChangePasswordPage')
);
const BookmarksPage = lazy(() => import('./pages/bookmarks/BookmarksPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="50vh"
    >
      <CircularProgress />
    </Box>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* Legacy login redirect */}
        <Route path="/login" element={<LoginPage />} />

        {/* Post routes */}
        <Route path="/posts/new" element={<CreatePostPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />

        {/* User routes */}
        <Route path="/users/:username" element={<UserProfilePage />} />

        {/* Bookmarks route */}
        <Route path="/bookmarks" element={<BookmarksPage />} />

        {/* Settings routes */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/password" element={<ChangePasswordPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
