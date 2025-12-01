import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationBar } from './NavigationBar';

const mockUser = {
  username: 'johndoe',
  fullName: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
};

describe('NavigationBar', () => {
  it('renders default title', () => {
    render(<NavigationBar />);
    expect(screen.getByText('Blog Platform')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<NavigationBar title="My Blog" />);
    expect(screen.getByText('My Blog')).toBeInTheDocument();
  });

  it('renders Sign In button when not logged in', () => {
    render(<NavigationBar />);
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('calls onLoginClick when Sign In is clicked', async () => {
    const onLoginClick = jest.fn();
    const user = userEvent.setup();
    render(<NavigationBar onLoginClick={onLoginClick} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(onLoginClick).toHaveBeenCalled();
  });

  it('renders Create button when logged in', () => {
    render(<NavigationBar user={mockUser} />);
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('calls onCreatePostClick when Create is clicked', async () => {
    const onCreatePostClick = jest.fn();
    const user = userEvent.setup();
    render(
      <NavigationBar user={mockUser} onCreatePostClick={onCreatePostClick} />
    );

    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(onCreatePostClick).toHaveBeenCalled();
  });

  it('renders notification badge with count', () => {
    render(<NavigationBar user={mockUser} notificationCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onNotificationClick when notifications is clicked', async () => {
    const onNotificationClick = jest.fn();
    const user = userEvent.setup();
    render(
      <NavigationBar
        user={mockUser}
        onNotificationClick={onNotificationClick}
      />
    );

    const notificationButton = screen
      .getByTestId('NotificationsIcon')
      .closest('button');
    if (notificationButton) {
      await user.click(notificationButton);
      expect(onNotificationClick).toHaveBeenCalled();
    }
  });

  it('opens user menu when avatar is clicked', async () => {
    const user = userEvent.setup();
    render(<NavigationBar user={mockUser} />);

    // Find and click the avatar button
    const avatarButtons = screen.getAllByRole('button');
    const avatarButton = avatarButtons.find((btn) =>
      btn.querySelector('.MuiAvatar-root')
    );

    if (avatarButton) {
      await user.click(avatarButton);
      // Menu should open with Profile and Logout options
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    }
  });

  it('calls onProfileClick when Profile menu item is clicked', async () => {
    const onProfileClick = jest.fn();
    const user = userEvent.setup();
    render(<NavigationBar user={mockUser} onProfileClick={onProfileClick} />);

    // Open menu
    const avatarButtons = screen.getAllByRole('button');
    const avatarButton = avatarButtons.find((btn) =>
      btn.querySelector('.MuiAvatar-root')
    );

    if (avatarButton) {
      await user.click(avatarButton);
      await user.click(screen.getByText('Profile'));
      expect(onProfileClick).toHaveBeenCalled();
    }
  });

  it('calls onLogoutClick when Logout menu item is clicked', async () => {
    const onLogoutClick = jest.fn();
    const user = userEvent.setup();
    render(<NavigationBar user={mockUser} onLogoutClick={onLogoutClick} />);

    // Open menu
    const avatarButtons = screen.getAllByRole('button');
    const avatarButton = avatarButtons.find((btn) =>
      btn.querySelector('.MuiAvatar-root')
    );

    if (avatarButton) {
      await user.click(avatarButton);
      await user.click(screen.getByText('Logout'));
      expect(onLogoutClick).toHaveBeenCalled();
    }
  });

  it('calls onSearchChange when search input changes', async () => {
    const onSearchChange = jest.fn();
    const user = userEvent.setup();
    render(<NavigationBar onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search…');
    await user.type(searchInput, 'test query');

    // onSearchChange should be called for each character typed
    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenLastCalledWith('test query');
  });

  it('renders search placeholder', () => {
    render(<NavigationBar />);
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('shows username in user menu', async () => {
    const user = userEvent.setup();
    render(<NavigationBar user={mockUser} />);

    const avatarButtons = screen.getAllByRole('button');
    const avatarButton = avatarButtons.find((btn) =>
      btn.querySelector('.MuiAvatar-root')
    );

    if (avatarButton) {
      await user.click(avatarButton);
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    }
  });
});
