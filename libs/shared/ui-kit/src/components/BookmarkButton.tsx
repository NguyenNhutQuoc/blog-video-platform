import { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { BookmarkBorder, Bookmark } from '@mui/icons-material';
import {
  useBookmarkPost,
  useUnbookmarkPost,
  useBookmarkFolders,
  type BookmarkFolder,
} from '@blog/shared-data-access';

interface BookmarkButtonProps {
  postId: string;
  isBookmarked: boolean;
  onAuthRequired?: () => void;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function BookmarkButton({
  postId,
  isBookmarked,
  onAuthRequired,
  showLabel = false,
  size = 'medium',
}: BookmarkButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [note, setNote] = useState('');

  const bookmarkMutation = useBookmarkPost();
  const unbookmarkMutation = useUnbookmarkPost();
  const { data: folders, isLoading: foldersLoading } = useBookmarkFolders();

  const handleClick = () => {
    if (isBookmarked) {
      // Unbookmark directly
      unbookmarkMutation.mutate(postId);
    } else {
      // Check if user is authenticated
      if (onAuthRequired) {
        onAuthRequired();
        return;
      }
      // Open dialog to select folder
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedFolderId('');
    setNote('');
  };

  const handleConfirmBookmark = async () => {
    try {
      await bookmarkMutation.mutateAsync({
        postId,
        folderId: selectedFolderId || undefined,
        note: note.trim() || undefined,
      });
      handleDialogClose();
    } catch (error) {
      console.error('Bookmark failed:', error);
    }
  };

  const isLoading = bookmarkMutation.isPending || unbookmarkMutation.isPending;

  return (
    <>
      <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
        <IconButton
          onClick={handleClick}
          disabled={isLoading}
          size={size}
          color={isBookmarked ? 'primary' : 'default'}
        >
          {isLoading ? (
            <CircularProgress size={20} />
          ) : isBookmarked ? (
            <Bookmark />
          ) : (
            <BookmarkBorder />
          )}
        </IconButton>
      </Tooltip>

      {showLabel && (
        <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Typography>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save to Bookmark</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Folder</InputLabel>
              <Select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                label="Folder"
                disabled={foldersLoading}
              >
                {foldersLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading folders...
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">
                      <em>Default folder</em>
                    </MenuItem>
                    {folders?.map((folder: BookmarkFolder) => (
                      <MenuItem key={folder.id} value={folder.id}>
                        {folder.color && (
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: folder.color,
                              mr: 1,
                            }}
                          />
                        )}
                        {folder.name} ({folder.bookmarkCount})
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
            </FormControl>

            <TextField
              label="Note (optional)"
              multiline
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this bookmark..."
              inputProps={{ maxLength: 500 }}
              helperText={`${note.length}/500 characters`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleConfirmBookmark}
            variant="contained"
            disabled={bookmarkMutation.isPending}
          >
            {bookmarkMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
