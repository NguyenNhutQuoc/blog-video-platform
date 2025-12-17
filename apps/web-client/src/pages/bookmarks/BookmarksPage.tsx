import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Button,
} from '@mui/material';
import { MoreVert, Delete, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from '@blog/shared-ui-kit';
import {
  useUserBookmarks,
  useBookmarkFolders,
  useDeleteFolder,
  type BookmarkFolder,
  type Bookmark,
} from '@blog/shared-data-access';
import { formatDate } from '@blog/shared-utils';

export function BookmarksPage() {
  const navigate = useNavigate();
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFolderId, setMenuFolderId] = useState<string | null>(null);

  const { data: folders, isLoading: foldersLoading } = useBookmarkFolders();
  const {
    data: bookmarksData,
    isLoading: bookmarksLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserBookmarks(selectedFolderId);
  const deleteFolderMutation = useDeleteFolder();

  const bookmarks =
    bookmarksData?.pages.flatMap((page) => page.bookmarks) ?? [];

  const handleFolderChange = (
    _event: React.SyntheticEvent,
    newValue: string
  ) => {
    setSelectedFolderId(newValue === 'all' ? undefined : newValue);
  };

  const handleFolderMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    folderId: string
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuFolderId(folderId);
  };

  const handleFolderMenuClose = () => {
    setAnchorEl(null);
    setMenuFolderId(null);
  };

  const handleEditFolder = () => {
    // TODO: Implement edit folder dialog
    console.log('Edit folder:', menuFolderId);
    handleFolderMenuClose();
  };

  const handleDeleteFolder = async () => {
    if (!menuFolderId) return;

    if (
      window.confirm(
        'Delete this folder? Bookmarks will be moved to default folder.'
      )
    ) {
      try {
        await deleteFolderMutation.mutateAsync(menuFolderId);
        if (selectedFolderId === menuFolderId) {
          setSelectedFolderId(undefined);
        }
      } catch (error) {
        console.error('Delete folder failed:', error);
      }
    }
    handleFolderMenuClose();
  };

  const handlePostClick = (slug: string) => {
    navigate(`/posts/${slug}`);
  };

  if (foldersLoading) {
    return (
      <>
        <NavigationBar />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  const defaultFolder = folders?.find((f) => f.isDefault);
  const customFolders = folders?.filter((f) => !f.isDefault) ?? [];

  return (
    <>
      <NavigationBar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Bookmarks
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedFolderId ?? 'all'}
            onChange={handleFolderChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label={`All (${defaultFolder?.bookmarkCount ?? 0})`}
              value="all"
            />
            {customFolders.map((folder: BookmarkFolder) => (
              <Tab
                key={folder.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {folder.color && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: folder.color,
                        }}
                      />
                    )}
                    {folder.name} ({folder.bookmarkCount})
                    <IconButton
                      size="small"
                      onClick={(e) => handleFolderMenuOpen(e, folder.id)}
                      sx={{ ml: 0.5, p: 0.5 }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                }
                value={folder.id}
              />
            ))}
          </Tabs>
        </Paper>

        {bookmarksLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : bookmarks.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No bookmarks yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start bookmarking posts to save them for later
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Browse Posts
            </Button>
          </Paper>
        ) : (
          <>
            <Stack spacing={2}>
              {bookmarks.map((bookmark: Bookmark) => (
                <Card key={bookmark.id}>
                  <CardActionArea
                    onClick={() => handlePostClick(bookmark.post.slug)}
                  >
                    <Box sx={{ display: 'flex' }}>
                      {bookmark.post.featuredImageUrl && (
                        <CardMedia
                          component="img"
                          sx={{ width: 200, height: 140, objectFit: 'cover' }}
                          image={bookmark.post.featuredImageUrl}
                          alt={bookmark.post.title}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <CardContent>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {bookmark.post.title}
                          </Typography>
                          {bookmark.post.excerpt && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mb: 1,
                              }}
                            >
                              {bookmark.post.excerpt}
                            </Typography>
                          )}
                          {bookmark.note && (
                            <Paper
                              variant="outlined"
                              sx={{ p: 1, mb: 1, bgcolor: 'action.hover' }}
                            >
                              <Typography variant="body2" fontStyle="italic">
                                {bookmark.note}
                              </Typography>
                            </Paper>
                          )}
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'center',
                              flexWrap: 'wrap',
                            }}
                          >
                            <Chip
                              size="small"
                              label={bookmark.post.author.username}
                              avatar={
                                bookmark.post.author.avatarUrl ? (
                                  <img
                                    src={bookmark.post.author.avatarUrl}
                                    alt=""
                                  />
                                ) : undefined
                              }
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Bookmarked {formatDate(bookmark.createdAt)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>

            {hasNextPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleFolderMenuClose}
        >
          <MenuItem onClick={handleEditFolder}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit Folder
          </MenuItem>
          <MenuItem onClick={handleDeleteFolder} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete Folder
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
}
