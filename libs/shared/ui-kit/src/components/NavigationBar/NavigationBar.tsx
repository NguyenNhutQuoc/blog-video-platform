import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Stack,
  Box,
  InputBase,
  alpha,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Notifications,
  Menu as MenuIcon,
  Add,
  Login,
} from '@mui/icons-material';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';

export interface NavigationBarProps {
  title?: string;
  user?: {
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  notificationCount?: number;
  onMenuClick?: () => void;
  onSearchChange?: (query: string) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onLoginClick?: () => void;
  onCreatePostClick?: () => void;
  onLogoutClick?: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  title = 'Blog Platform',
  user,
  notificationCount = 0,
  onMenuClick,
  onSearchChange,
  onNotificationClick,
  onProfileClick,
  onLoginClick,
  onCreatePostClick,
  onLogoutClick,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    onProfileClick?.();
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    onLogoutClick?.();
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        {/* Menu Icon */}
        <IconButton
          edge="start"
          color="inherit"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mr: 4, cursor: 'pointer' }}
          onClick={() => (window.location.href = '/')}
        >
          {title}
        </Typography>

        {/* Search Bar */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: 20,
            backgroundColor: (theme) => alpha(theme.palette.common.black, 0.05),
            '&:hover': {
              backgroundColor: (theme) =>
                alpha(theme.palette.common.black, 0.08),
            },
            marginRight: 'auto',
            width: { xs: 'auto', sm: '400px' },
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Box
            sx={{
              padding: (theme) => theme.spacing(0, 2),
              height: '100%',
              position: 'absolute',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search color="action" />
          </Box>
          <InputBase
            placeholder="Search…"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              color: 'inherit',
              width: '100%',
              '& .MuiInputBase-input': {
                padding: (theme) => theme.spacing(1, 1, 1, 0),
                paddingLeft: (theme) => `calc(1em + ${theme.spacing(4)})`,
                transition: (theme) => theme.transitions.create('width'),
                width: '100%',
              },
            }}
          />
        </Box>

        {/* Right Side Actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          {user ? (
            <>
              {/* Create Post Button */}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onCreatePostClick}
                sx={{ fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
              >
                Create
              </Button>

              <IconButton
                onClick={onCreatePostClick}
                sx={{ display: { xs: 'flex', sm: 'none' } }}
              >
                <Add />
              </IconButton>

              {/* Notifications */}
              <IconButton color="inherit" onClick={onNotificationClick}>
                <Badge badgeContent={notificationCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              {/* User Avatar & Menu */}
              <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                <Avatar
                  src={user.avatarUrl}
                  name={user.fullName}
                  sx={{ width: 36, height: 36 }}
                />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleProfileClick}>
                  <Typography variant="body2">@{user.username}</Typography>
                </MenuItem>
                <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
                <MenuItem onClick={handleLogoutClick}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<Login />}
              onClick={onLoginClick}
              sx={{ fontWeight: 600 }}
            >
              Sign In
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;
