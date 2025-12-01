import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfileCard } from './UserProfileCard';

const mockProfile = {
  username: 'johndoe',
  fullName: 'John Doe',
  bio: 'Software developer passionate about React and TypeScript.',
  avatarUrl: 'https://example.com/avatar.jpg',
  postsCount: 42,
  followersCount: 1500,
  followingCount: 320,
  isFollowing: false,
  isOwnProfile: false,
};

describe('UserProfileCard', () => {
  it('renders full name', () => {
    render(<UserProfileCard {...mockProfile} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders username with @ prefix', () => {
    render(<UserProfileCard {...mockProfile} />);
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  it('renders bio', () => {
    render(<UserProfileCard {...mockProfile} />);
    expect(
      screen.getByText(
        'Software developer passionate about React and TypeScript.'
      )
    ).toBeInTheDocument();
  });

  it('renders posts count', () => {
    render(<UserProfileCard {...mockProfile} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('renders followers count', () => {
    render(<UserProfileCard {...mockProfile} />);
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
  });

  it('renders following count', () => {
    render(<UserProfileCard {...mockProfile} />);
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('shows Follow button when not following and not own profile', () => {
    render(
      <UserProfileCard
        {...mockProfile}
        isFollowing={false}
        isOwnProfile={false}
      />
    );
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
  });

  it('shows Following button when following', () => {
    render(
      <UserProfileCard
        {...mockProfile}
        isFollowing={true}
        isOwnProfile={false}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Following' })
    ).toBeInTheDocument();
  });

  it('shows Edit Profile button when own profile', () => {
    render(<UserProfileCard {...mockProfile} isOwnProfile={true} />);
    expect(
      screen.getByRole('button', { name: 'Edit Profile' })
    ).toBeInTheDocument();
  });

  it('calls onFollow when Follow button is clicked', async () => {
    const onFollow = jest.fn();
    const user = userEvent.setup();
    render(
      <UserProfileCard
        {...mockProfile}
        isFollowing={false}
        onFollow={onFollow}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Follow' }));
    expect(onFollow).toHaveBeenCalled();
  });

  it('calls onUnfollow when Following button is clicked', async () => {
    const onUnfollow = jest.fn();
    const user = userEvent.setup();
    render(
      <UserProfileCard
        {...mockProfile}
        isFollowing={true}
        onUnfollow={onUnfollow}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Following' }));
    expect(onUnfollow).toHaveBeenCalled();
  });

  it('calls onEdit when Edit Profile button is clicked', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();
    render(
      <UserProfileCard {...mockProfile} isOwnProfile={true} onEdit={onEdit} />
    );

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('renders without bio', () => {
    const profileWithoutBio = { ...mockProfile, bio: undefined };
    render(<UserProfileCard {...profileWithoutBio} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Software developer passionate about React and TypeScript.'
      )
    ).not.toBeInTheDocument();
  });

  it('renders avatar with initials when no avatarUrl', () => {
    const profileWithoutAvatar = { ...mockProfile, avatarUrl: undefined };
    render(<UserProfileCard {...profileWithoutAvatar} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
