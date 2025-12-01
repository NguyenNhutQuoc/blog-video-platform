import React from 'react';
import { render } from '@testing-library/react';
import { PostCardSkeleton } from './PostCardSkeleton';
import { UserProfileCardSkeleton } from './UserProfileCardSkeleton';
import { CommentCardSkeleton } from './CommentCardSkeleton';
import { NavigationBarSkeleton } from './NavigationBarSkeleton';
import { PostDetailSkeleton } from './PostDetailSkeleton';

describe('PostCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<PostCardSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders with image placeholder by default', () => {
    const { container } = render(<PostCardSkeleton />);
    const rectangularSkeleton = container.querySelector(
      '.MuiSkeleton-rectangular'
    );
    expect(rectangularSkeleton).toBeInTheDocument();
  });

  it('renders without image placeholder when hasImage is false', () => {
    const { container } = render(<PostCardSkeleton hasImage={false} />);
    const rectangularSkeleton = container.querySelector(
      '.MuiSkeleton-rectangular'
    );
    expect(rectangularSkeleton).not.toBeInTheDocument();
  });
});

describe('UserProfileCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<UserProfileCardSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders circular skeleton for avatar', () => {
    const { container } = render(<UserProfileCardSkeleton />);
    const circularSkeleton = container.querySelector('.MuiSkeleton-circular');
    expect(circularSkeleton).toBeInTheDocument();
  });
});

describe('CommentCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<CommentCardSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders circular skeleton for avatar', () => {
    const { container } = render(<CommentCardSkeleton />);
    const circularSkeleton = container.querySelector('.MuiSkeleton-circular');
    expect(circularSkeleton).toBeInTheDocument();
  });
});

describe('NavigationBarSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<NavigationBarSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders within an AppBar', () => {
    const { container } = render(<NavigationBarSkeleton />);
    const appBar = container.querySelector('.MuiAppBar-root');
    expect(appBar).toBeInTheDocument();
  });
});

describe('PostDetailSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<PostDetailSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders rectangular skeleton for featured image', () => {
    const { container } = render(<PostDetailSkeleton />);
    const rectangularSkeleton = container.querySelector(
      '.MuiSkeleton-rectangular'
    );
    expect(rectangularSkeleton).toBeInTheDocument();
  });

  it('renders multiple text skeletons for content', () => {
    const { container } = render(<PostDetailSkeleton />);
    const textSkeletons = container.querySelectorAll('.MuiSkeleton-text');
    expect(textSkeletons.length).toBeGreaterThan(10);
  });
});
