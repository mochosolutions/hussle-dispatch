import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  IconButton,
  Stack,
  Tooltip,
  ClickAwayListener,
} from '@mui/material';
import { CancelButton } from '@mocho/ui/components';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

export const InlineEditableNotes: React.FC<{
  value: string;
  author: string;
  date: string;
  onSave: (value: string) => void;
}> = ({ value, author, date, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const handleSave = () => {
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <Card sx={{ p: 0 }}>
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
        >
          Notes
        </Typography>
        {!editing && (
          <Tooltip title="Edit notes">
            <IconButton size="small" onClick={() => setEditing(true)}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ px: 2.5, py: 2 }}>
        {editing ? (
          <ClickAwayListener onClickAway={handleSave}>
            <Box>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={8}
                inputRef={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="Add notes about this carrier…"
                sx={{ mb: 1.5 }}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <CancelButton onClick={handleCancel} size="small" />
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                >
                  Save
                </Button>
              </Stack>
            </Box>
          </ClickAwayListener>
        ) : (
          <Box
            onClick={() => setEditing(true)}
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              p: 1,
              mx: -1,
              transition: 'background 0.15s',
              '&:hover': { bgcolor: 'grey.50' },
            }}
          >
            {value ? (
              <>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                >
                  {value}
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {author} — {date}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                Click to add notes about this carrier…
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
};
