'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Box, IconButton, Divider, Paper, Tooltip } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
} from '@mui/icons-material';
import { useEffect } from 'react';
import './rich-text-editor.css';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  error = false,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        '&:focus-within': {
          borderColor: error ? 'error.main' : 'primary.main',
          borderWidth: 2,
        },
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          p: 1,
          bgcolor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title="Bold">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            sx={{
              bgcolor: editor.isActive('bold')
                ? 'action.selected'
                : 'transparent',
            }}
          >
            <FormatBold fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Italic">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            sx={{
              bgcolor: editor.isActive('italic')
                ? 'action.selected'
                : 'transparent',
            }}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Bullet List">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            sx={{
              bgcolor: editor.isActive('bulletList')
                ? 'action.selected'
                : 'transparent',
            }}
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Numbered List">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            sx={{
              bgcolor: editor.isActive('orderedList')
                ? 'action.selected'
                : 'transparent',
            }}
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Blockquote">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            sx={{
              bgcolor: editor.isActive('blockquote')
                ? 'action.selected'
                : 'transparent',
            }}
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Code Block">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            sx={{
              bgcolor: editor.isActive('codeBlock')
                ? 'action.selected'
                : 'transparent',
            }}
          >
            <Code fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Insert Image">
          <IconButton size="small" onClick={addImage}>
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Insert Link">
          <IconButton
            size="small"
            onClick={addLink}
            sx={{
              bgcolor: editor.isActive('link')
                ? 'action.selected'
                : 'transparent',
            }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Undo">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
          >
            <Undo fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Redo">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
          >
            <Redo fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Editor Content */}
      <Box
        sx={{
          p: 2,
          minHeight: 300,
          maxHeight: 600,
          overflow: 'auto',
          '& .ProseMirror': {
            outline: 'none',
            minHeight: 260,
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}

export default RichTextEditor;
