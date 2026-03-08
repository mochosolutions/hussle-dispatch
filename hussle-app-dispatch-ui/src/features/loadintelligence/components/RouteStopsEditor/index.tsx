import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  OutlinedInput,
  Typography,
} from '@mui/material';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import type { Location, Stop } from '../../types';
import { weightFormatter } from '../../formatters';

interface RouteStopsEditorProps {
  stops: Stop[];
  onChange: (stops: Stop[]) => void;
}

interface StopDraft {
  city: string;
  state: string;
  zip: string;
  commodity: string;
  weight: string;
}

const draftFromStop = (stop: Stop): StopDraft => ({
  city: stop.location.city,
  state: stop.location.state,
  zip: stop.location.zip,
  commodity: stop.commodity,
  weight: stop.weight !== null ? String(stop.weight) : '',
});

const emptyDraft = (): StopDraft => ({
  city: '',
  state: '',
  zip: '',
  commodity: '',
  weight: '',
});

const formatStopLocation = (location: Location): string => {
  const parts = [location.city, location.state].filter(Boolean);
  const base = parts.join(', ');

  if (location.zip) {
    return `${base} ${location.zip}`;
  }

  return base || 'New stop';
};

const formatStopSubtitle = (stop: Stop): string => {
  const parts: string[] = [];

  if (stop.commodity) {
    parts.push(stop.commodity);
  }

  if (stop.weight !== null && stop.weight > 0) {
    parts.push(`${weightFormatter.format(stop.weight)} lbs`);
  }

  return parts.join(' \u00B7 ');
};

const StopRow: React.FC<{
  stop: Stop;
  canRemove: boolean;
  isEditing: boolean;
  draft: StopDraft;
  onDraftChange: (draft: StopDraft) => void;
  onEditStart: () => void;
  onEditConfirm: () => void;
  onEditCancel: () => void;
  onRemove: () => void;
}> = ({
  stop,
  canRemove,
  isEditing,
  draft,
  onDraftChange,
  onEditStart,
  onEditConfirm,
  onEditCancel,
  onRemove,
}) => {
  const handleFieldChange = (field: keyof StopDraft) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onDraftChange({ ...draft, [field]: e.target.value });
  };

  if (isEditing) {
    return (
      <Box
        sx={{
          p: 1.5,
          border: 1,
          borderColor: 'primary.main',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Grid container spacing={1}>
          <Grid item xs={5}>
            <OutlinedInput
              value={draft.city}
              onChange={handleFieldChange('city')}
              placeholder="City"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <OutlinedInput
              value={draft.state}
              onChange={handleFieldChange('state')}
              placeholder="ST"
              size="small"
              fullWidth
              inputProps={{ maxLength: 2 }}
            />
          </Grid>
          <Grid item xs={4}>
            <OutlinedInput
              value={draft.zip}
              onChange={handleFieldChange('zip')}
              placeholder="ZIP"
              size="small"
              fullWidth
              inputProps={{ maxLength: 5 }}
            />
          </Grid>
          <Grid item xs={7}>
            <OutlinedInput
              value={draft.commodity}
              onChange={handleFieldChange('commodity')}
              placeholder="Commodity"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={5}>
            <OutlinedInput
              value={draft.weight}
              onChange={handleFieldChange('weight')}
              placeholder="Weight (lbs)"
              size="small"
              type="number"
              fullWidth
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
          <IconButton size="small" onClick={onEditConfirm} aria-label="Confirm edit">
            <CheckOutlined />
          </IconButton>
          <IconButton size="small" onClick={onEditCancel} aria-label="Cancel edit">
            <CloseOutlined />
          </IconButton>
        </Box>
      </Box>
    );
  }

  const subtitle = formatStopSubtitle(stop);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: stop.type === 'pickup' ? 'success.main' : 'info.main',
            mt: 0.75,
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatStopLocation(stop.location)}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
        <IconButton size="small" onClick={onEditStart} aria-label="Edit stop">
          <EditOutlined />
        </IconButton>
        {canRemove && (
          <IconButton size="small" onClick={onRemove} aria-label="Remove stop">
            <DeleteOutlined />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export const RouteStopsEditor: React.FC<RouteStopsEditorProps> = ({ stops, onChange }) => {
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StopDraft>(emptyDraft());

  const pickups = stops.filter((s) => s.type === 'pickup');
  const dropoffs = stops.filter((s) => s.type === 'dropoff');

  const handleEditStart = (stop: Stop) => {
    setEditingStopId(stop.id);
    setDraft(draftFromStop(stop));
  };

  const handleEditCancel = () => {
    // If this is a newly added stop with empty location, remove it
    const stop = stops.find((s) => s.id === editingStopId);

    if (stop && !stop.location.city && !stop.location.state && !stop.location.zip) {
      onChange(stops.filter((s) => s.id !== editingStopId));
    }

    setEditingStopId(null);
  };

  const handleEditConfirm = () => {
    if (!editingStopId) {
      return;
    }

    const parsedWeight = draft.weight ? Number(draft.weight) : null;

    const updated = stops.map((s) => {
      if (s.id !== editingStopId) {
        return s;
      }

      return {
        ...s,
        location: {
          city: draft.city.trim(),
          state: draft.state.trim().toUpperCase(),
          country: s.location.country,
          zip: draft.zip.trim(),
        },
        commodity: draft.commodity.trim(),
        weight: parsedWeight,
      };
    });

    onChange(updated);
    setEditingStopId(null);
  };

  const handleRemove = (stopId: string) => {
    onChange(stops.filter((s) => s.id !== stopId));
  };

  const handleAddStop = (type: 'pickup' | 'dropoff') => {
    const newStop: Stop = {
      id: crypto.randomUUID(),
      type,
      location: { city: '', state: '', country: 'US', zip: '' },
      commodity: '',
      weight: null,
    };

    let updated: Stop[];

    if (type === 'pickup') {
      // Insert before first dropoff
      const firstDropoffIndex = stops.findIndex((s) => s.type === 'dropoff');

      if (firstDropoffIndex === -1) {
        updated = [...stops, newStop];
      } else {
        updated = [
          ...stops.slice(0, firstDropoffIndex),
          newStop,
          ...stops.slice(firstDropoffIndex),
        ];
      }
    } else {
      // Insert before the last dropoff
      const lastDropoffIndex = stops.length - 1 - [...stops].reverse().findIndex((s) => s.type === 'dropoff');

      if (lastDropoffIndex < 0 || lastDropoffIndex >= stops.length) {
        updated = [...stops, newStop];
      } else {
        updated = [
          ...stops.slice(0, lastDropoffIndex),
          newStop,
          ...stops.slice(lastDropoffIndex),
        ];
      }
    }

    onChange(updated);
    setEditingStopId(newStop.id);
    setDraft(emptyDraft());
  };

  const canRemoveStop = (stop: Stop): boolean => {
    if (stop.type === 'pickup') {
      return pickups.indexOf(stop) !== 0;
    }

    return dropoffs.indexOf(stop) !== dropoffs.length - 1;
  };

  const renderStopList = (
    label: string,
    stopList: Stop[],
    type: 'pickup' | 'dropoff',
  ) => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Button
          size="small"
          startIcon={<PlusOutlined />}
          onClick={() => handleAddStop(type)}
          sx={{ textTransform: 'none', minWidth: 'auto' }}
        >
          Add
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {stopList.map((stop) => (
          <StopRow
            key={stop.id}
            stop={stop}
            canRemove={canRemoveStop(stop)}
            isEditing={editingStopId === stop.id}
            draft={editingStopId === stop.id ? draft : emptyDraft()}
            onDraftChange={setDraft}
            onEditStart={() => handleEditStart(stop)}
            onEditConfirm={handleEditConfirm}
            onEditCancel={handleEditCancel}
            onRemove={() => handleRemove(stop.id)}
          />
        ))}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'grey.50',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        Route
      </Typography>

      {renderStopList('PICKUPS', pickups, 'pickup')}

      {/* Visual connector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          ↓
        </Typography>
      </Box>

      {renderStopList('DROPOFFS', dropoffs, 'dropoff')}
    </Box>
  );
};
