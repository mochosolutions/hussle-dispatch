import { useCallback, useState } from 'react';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { enqueueSnackbar } from 'notistack';
import { createPlace } from 'utils/api/places/placeApi';

interface SaveAsPlacePromptProps {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  onSave: (placeId: string) => void;
  onDismiss: () => void;
}

export const SaveAsPlacePrompt: React.FC<SaveAsPlacePromptProps> = ({
  name: initialName,
  address,
  city,
  state,
  zip,
  lat,
  lng,
  onSave,
  onDismiss,
}) => {
  const [placeName, setPlaceName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (placeName.trim().length === 0) {
      return;
    }

    setSaving(true);
    try {
      const place = await createPlace({
        name: placeName.trim(),
        address,
        city,
        state,
        zip,
        latitude: lat,
        longitude: lng,
      });
      onSave(place.id);
      enqueueSnackbar('Place saved successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save place', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [placeName, address, city, state, zip, lat, lng, onSave]);

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 2,
        border: '1px solid',
        borderColor: 'primary.light',
        borderRadius: 1,
        backgroundColor: 'primary.50',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <BookmarkBorderOutlined sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        Save as Place?
      </Typography>
      <TextField
        size="small"
        value={placeName}
        onChange={(e) => setPlaceName(e.target.value)}
        sx={{ flex: 1 }}
        inputProps={{ 'aria-label': 'Place name' }}
      />
      <Button
        size="small"
        variant="contained"
        disabled={saving || placeName.trim().length === 0}
        onClick={() => void handleSave()}
        sx={{ textTransform: 'none', minWidth: 60 }}
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
      <IconButton size="small" onClick={onDismiss} aria-label="Dismiss save prompt">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default SaveAsPlacePrompt;
