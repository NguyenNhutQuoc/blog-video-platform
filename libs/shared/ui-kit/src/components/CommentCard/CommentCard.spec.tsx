import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentCard } from './CommentCard';

const mockComment = {
  id: '1',
  content: 'This is a test comment content.',
  author: {
    username: 'janedoe',
    fullName: 'Jane Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  createdAt: '2024-01-15T10:00:00Z',
  likeCount: 5,
  isLiked: false,
};

describe('CommentCard', () => {
  it('renders comment content', () => {
    render(<CommentCard {...mockComment} />);
    expect(
      screen.getByText('This is a test comment content.')
    ).toBeInTheDocument();
  });

  it('renders author full name', () => {
    render(<CommentCard {...mockComment} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders author username', () => {
    render(<CommentCard {...mockComment} />);
    expect(screen.getByText('@janedoe')).toBeInTheDocument();
  });

  it('renders like count when greater than 0', () => {
    render(<CommentCard {...mockComment} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render like count when 0', () => {
    render(<CommentCard {...mockComment} likeCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows filled heart when comment is liked', () => {
    render(<CommentCard {...mockComment} isLiked={true} />);
    expect(screen.getByTestId('FavoriteIcon')).toBeInTheDocument();
  });

  it('shows outlined heart when comment is not liked', () => {
    render(<CommentCard {...mockComment} isLiked={false} />);
    expect(screen.getByTestId('FavoriteBorderIcon')).toBeInTheDocument();
  });

  it('calls onLike when like button is clicked', async () => {
    const onLike = jest.fn();
    const user = userEvent.setup();
    render(<CommentCard {...mockComment} onLike={onLike} />);

    const likeButton = screen
      .getByTestId('FavoriteBorderIcon')
      .closest('button');
    if (likeButton) {
      await user.click(likeButton);
      expect(onLike).toHaveBeenCalled();
    }
  });

  it('renders Reply button', () => {
    render(<CommentCard {...mockComment} />);
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('calls onReply when Reply is clicked', async () => {
    const onReply = jest.fn();
    const user = userEvent.setup();
    render(<CommentCard {...mockComment} onReply={onReply} />);

    await user.click(screen.getByText('Reply'));
    expect(onReply).toHaveBeenCalled();
  });

  it('renders avatar with author initials when no avatarUrl', () => {
    const commentWithoutAvatar = {
      ...mockComment,
      author: { ...mockComment.author, avatarUrl: undefined },
    };
    render(<CommentCard {...commentWithoutAvatar} />);
    // Avatar should show initials "JD" for Jane Doe
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<CommentCard {...mockComment} />);
    // The date should be formatted as local date string
    const dateText = new Date('2024-01-15T10:00:00Z').toLocaleDateString();
    expect(screen.getByText(dateText)).toBeInTheDocument();
  });
});
