import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Formik, Form } from 'formik';
import { TextField, SelectField } from '@mocho/ui/components/form-fields';
import { stopSchema, STOP_TYPE_OPTIONS, EMPTY_STOP_VALUES } from '../../validators/stopSchema';
import type { StopFormValues } from '../../validators/stopSchema';
import type { Stop, StopType } from '../../types';

// ---------------------------------------------------------------------------
// Stop type display config
// ---------------------------------------------------------------------------

const STOP_TYPE_COLORS: Record<StopType, string> = {
  PICKUP: '#22c55e',
  DELIVERY: '#3b82f6',
  STOP_OFF: '#f59e0b',
  DROP_HOOK: '#8b5cf6',
  LIVE_UNLOAD: '#ec4899',
};

const STOP_TYPE_LABELS: Record<StopType, string> = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
  STOP_OFF: 'Stop Off',
  DROP_HOOK: 'Drop Hook',
  LIVE_UNLOAD: 'Live Unload',
};

const stopTypeOptions = STOP_TYPE_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditableStopCardProps {
  stop?: Stop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isNew?: boolean;
  onSave: (data: StopFormValues) => void;
  onDelete?: (stopId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCancelNew?: () => void;
}

// ---------------------------------------------------------------------------
// EditableStopCard
// ---------------------------------------------------------------------------

export const EditableStopCard: React.FC<EditableStopCardProps> = ({
  stop,
  index,
  isFirst,
  isLast,
  isNew = false,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCancelNew,
}) => {
  const [editing, setEditing] = useState(isNew);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initialValues: StopFormValues = stop
    ? {
        type: stop.type,
        facilityName: stop.facilityName ?? '',
        address: stop.address ?? '',
        city: stop.city ?? '',
        state: stop.state ?? '',
        zip: stop.zip ?? '',
        appointmentDate: stop.appointmentDate ?? '',
        appointmentTime: stop.appointmentTime ?? '',
        contactName: stop.contactName ?? '',
        contactPhone: stop.contactPhone ?? '',
        notes: stop.notes ?? '',
      }
    : EMPTY_STOP_VALUES;

  const color = STOP_TYPE_COLORS[stop?.type ?? 'PICKUP'];

  const handleEdit = useCallback(() => {
    setEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (isNew && onCancelNew) {
      onCancelNew();
    } else {
      setEditing(false);
    }
  }, [isNew, onCancelNew]);

  const handleSubmit = useCallback(
    (values: StopFormValues) => {
      onSave(values);
      setEditing(false);
    },
    [onSave],
  );

  const handleDeleteClick = useCallback(() => {
    setConfirmDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (stop && onDelete) {
      onDelete(stop.id);
    }
    setConfirmDelete(false);
  }, [stop, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Display mode
  // ---------------------------------------------------------------------------

  if (!editing) {
    const location = [stop?.city, stop?.state].filter(Boolean).join(', ');
    const addressLine = [stop?.address, location, stop?.zip].filter(Boolean).join(', ');

    return (
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Stack direction="column" spacing={0}>
                <Tooltip title="Move up">
                  <span>
                    <IconButton
                      size="small"
                      onClick={onMoveUp}
                      disabled={isFirst}
                      sx={{ p: 0.25 }}
                    >
                      <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton
                      size="small"
                      onClick={onMoveDown}
                      disabled={isLast}
                      sx={{ p: 0.25 }}
                    >
                      <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Stop {index + 1}
              </Typography>
              <Chip
                label={STOP_TYPE_LABELS[stop?.type ?? 'PICKUP']}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  bgcolor: `${color}20`,
                  color,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Edit stop">
                <IconButton size="small" onClick={handleEdit}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              {onDelete && (
                <Tooltip title="Remove stop">
                  <IconButton size="small" color="error" onClick={handleDeleteClick}>
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {stop?.facilityName && (
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {stop.facilityName}
            </Typography>
          )}
          {addressLine && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {addressLine}
            </Typography>
          )}
          {(stop?.appointmentDate || stop?.appointmentTime) && (
            <Typography variant="caption" color="text.secondary">
              Appt: {[stop.appointmentDate, stop.appointmentTime].filter(Boolean).join(' ')}
            </Typography>
          )}

          {confirmDelete && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                bgcolor: 'error.lighter',
                borderRadius: 1,
                border: 1,
                borderColor: 'error.light',
              }}
            >
              <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 1 }}>
                Remove this stop?
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleDeleteConfirm}
                >
                  Remove
                </Button>
                <Button size="small" variant="outlined" onClick={handleDeleteCancel}>
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // Edit mode
  // ---------------------------------------------------------------------------

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'primary.main',
        borderRadius: 1,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1.5, display: 'block' }}>
          {isNew ? 'Add Stop' : `Edit Stop ${index + 1}`}
        </Typography>
        <Formik
          initialValues={initialValues}
          validationSchema={stopSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {(formik) => (
            <Form>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <SelectField
                      name="type"
                      label="Stop Type"
                      data={stopTypeOptions}
                      formik={formik}
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField name="facilityName" label="Facility Name" formik={formik} required />
                  </Grid>
                </Grid>

                <TextField name="address" label="Address" formik={formik} required />

                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <TextField name="city" label="City" formik={formik} required />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField name="state" label="State" formik={formik} required />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField name="zip" label="ZIP" formik={formik} required />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField name="appointmentDate" label="Appt Date" formik={formik} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField name="appointmentTime" label="Appt Time" formik={formik} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField name="contactName" label="Contact Name" formik={formik} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField name="contactPhone" label="Contact Phone" formik={formik} />
                  </Grid>
                </Grid>

                <TextField name="notes" label="Notes" formik={formik} multiline rows={2} />

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    type="submit"
                    disabled={!formik.isValid || formik.isSubmitting}
                  >
                    {isNew ? 'Add' : 'Save'}
                  </Button>
                </Stack>
              </Stack>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};
