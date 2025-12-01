import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostCard } from './PostCard';

const mockPost = {
  id: '1',
  title: 'Test Post Title',
  excerpt: 'This is a test excerpt for the post card component.',
  featuredImageUrl: 'https://example.com/image.jpg',
  author: {
    username: 'johndoe',
    fullName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  tags: ['react', 'typescript', 'testing'],
  likeCount: 42,
  commentCount: 15,
  isLiked: false,
  createdAt: '2024-01-15T10:00:00Z',
};

describe('PostCard', () => {
  it('renders post title', () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('renders post excerpt', () => {
    render(<PostCard {...mockPost} />);
    expect(
      screen.getByText('This is a test excerpt for the post card component.')
    ).toBeInTheDocument();
  });

  it('renders author information', () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/@johndoe/)).toBeInTheDocument();
  });

  it('renders like and comment counts', () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<PostCard {...mockPost} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('limits tags to 3', () => {
    const postWithManyTags = {
      ...mockPost,
      tags: ['react', 'typescript', 'testing', 'jest', 'node'],
    };
    render(<PostCard {...postWithManyTags} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.queryByText('jest')).not.toBeInTheDocument();
  });

  it('calls onLike when like button is clicked', async () => {
    const onLike = jest.fn();
    const user = userEvent.setup();
    render(<PostCard {...mockPost} onLike={onLike} />);

    const likeButtons = screen.getAllByRole('button');
    const likeButton = likeButtons.find((btn) =>
      btn.querySelector('[data-testid="FavoriteBorderIcon"]')
    );
    if (likeButton) {
      await user.click(likeButton);
      expect(onLike).toHaveBeenCalled();
    }
  });

  it('shows filled heart when post is liked', () => {
    render(<PostCard {...mockPost} isLiked={true} />);
    expect(screen.getByTestId('FavoriteIcon')).toBeInTheDocument();
  });

  it('shows outlined heart when post is not liked', () => {
    render(<PostCard {...mockPost} isLiked={false} />);
    expect(screen.getByTestId('FavoriteBorderIcon')).toBeInTheDocument();
  });

  it('calls onClick when content is clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<PostCard {...mockPost} onClick={onClick} />);

    await user.click(screen.getByText('Test Post Title'));
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onBookmark when bookmark button is clicked', async () => {
    const onBookmark = jest.fn();
    const user = userEvent.setup();
    render(<PostCard {...mockPost} onBookmark={onBookmark} />);

    const bookmarkButton = screen
      .getByTestId('BookmarkBorderIcon')
      .closest('button');
    if (bookmarkButton) {
      await user.click(bookmarkButton);
      expect(onBookmark).toHaveBeenCalled();
    }
  });

  it('renders without featured image', () => {
    const postWithoutImage = { ...mockPost, featuredImageUrl: undefined };
    render(<PostCard {...postWithoutImage} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Test Post Title' })
    ).not.toBeInTheDocument();
  });

  it('renders without tags', () => {
    const postWithoutTags = { ...mockPost, tags: [] };
    render(<PostCard {...postWithoutTags} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });
});
