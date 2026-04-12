import { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Collapse,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { FormikProps } from 'formik';
import { MainCard, TextField, DateField, TimeField } from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';
import type { StopsFormShape } from '../../validators/loadSchema';
import { AddressSearchField } from '../AddressSearchField';

export interface StopFormCardProps<T extends StopsFormShape = StopsFormShape> {
  index: number;
  prefix: string;
  formik: FormikProps<T>;
  canRemove: boolean;
  onRemove: () => void;
  defaultExpanded?: boolean;
  canReorder?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const StopFormCard = <T extends StopsFormShape = StopsFormShape>({
  index,
  prefix,
  formik,
  canRemove,
  onRemove,
  defaultExpanded = false,
  canReorder,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: StopFormCardProps<T>) => {
  const stop = formik.values.stops[index];
  const isPickup = stop.type === 'PICKUP';
  const accentColor = isPickup ? 'primary.main' : 'success.main';
  const accentBg = isPickup ? 'primary.50' : 'success.50';
  const stopLabel = isPickup ? 'Pickup stop' : 'Delivery stop';

  const [expanded, setExpanded] = useState(defaultExpanded);

  // Auto-expand when validation errors exist for this stop after submit attempt
  const stopErrors = formik.errors.stops?.[index];
  useEffect(() => {
    if (formik.submitCount > 0 && stopErrors && !expanded) {
      setExpanded(true);
    }
  }, [formik.submitCount, stopErrors, expanded]);

  const stopValues = formik.values.stops[index];
  const prefixedValues: Record<string, unknown> = {};
  if (stopValues !== undefined) {
    Object.entries(stopValues).forEach(([key, value]) => {
      prefixedValues[`${prefix}.${key}`] = value;
    });
  }

  const stopFormik: FormikFieldProps<Record<string, unknown>> = {
    values: prefixedValues,
    errors: {},
    touched: {},
    handleChange: formik.handleChange,
    handleBlur: formik.handleBlur,
    setFieldValue: formik.setFieldValue,
  };

  const commoditySummary = stop.commodity ? stop.commodity : null;

  return (
    <MainCard
      content={false}
      sx={{
        borderLeft: `2px solid`,
        borderLeftColor: accentColor,
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          alignItems: 'center',
          backgroundColor: accentBg,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          minHeight: 44,
          px: 1.25,
          py: 0.75,
        }}
      >
        {canReorder && (
          <Stack direction="column" spacing={0} sx={{ mr: 0.5 }}>
            <IconButton
              size="small"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Move stop up"
              sx={{ p: 0.25 }}
            >
              <ArrowUpwardIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Move stop down"
              sx={{ p: 0.25 }}
            >
              <ArrowDownwardIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        )}

        <Box
          sx={{
            backgroundColor: 'grey.100',
            p: 0.5,
          }}
        >
          <Typography color="text.secondary" sx={{ minWidth: 16 }} variant="caption">
            {index + 1}
          </Typography>
        </Box>

        {/* P/D badge */}
        <Chip
          size="small"
          label={stopLabel}
          sx={{
            backgroundColor: accentColor,
            color: 'common.white',
            fontWeight: 700,
            fontSize: 11,
            height: 24,
          }}
        />

        {stop.facilityName ? (
          <Typography sx={{ color: 'text.primary', fontWeight: 500 }} variant="body2">
            {stop.facilityName}
          </Typography>
        ) : null}

        {stop.city && stop.state ? (
          <Typography color="text.secondary" variant="caption">
            {`${stop.city}, ${stop.state.toUpperCase()}`}
          </Typography>
        ) : null}

        {commoditySummary ? (
          <Chip label={commoditySummary} size="small" variant="outlined" sx={{ fontSize: 10 }} />
        ) : null}

        {!stop.facilityName && !stop.placeId && (
          <Chip
            label="No facility"
            size="small"
            color="error"
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        )}
        {!stop.appointmentDate && (
          <Chip
            label="No appt"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        )}

        <Box sx={{ flex: 1 }} />

        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>

        {canRemove && (
          <IconButton size="small" onClick={onRemove} aria-label={`Remove stop ${index + 1}`}>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </IconButton>
        )}
      </Box>

      {/* Body */}
      <Collapse in={expanded}>
        <Box sx={{ p: 1.5 }}>
          <Grid container spacing={1.5}>
            {/* Address search */}
            <Grid item xs={12}>
              <AddressSearchField prefix={prefix} formik={formik} />
            </Grid>

            {/* Date/Time */}
            <Grid item xs={12} md={4}>
              <DateField name={`${prefix}.appointmentDate`} label="Date" formik={stopFormik} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TimeField name={`${prefix}.appointmentTime`} label="Time" formik={stopFormik} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name={`${prefix}.appointmentNumber`}
                label="Appt #"
                formik={stopFormik}
              />
            </Grid>
          </Grid>

          {/* Commodity fields (pickup) */}
          {isPickup && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Commodity
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <TextField
                    name={`${prefix}.commodity`}
                    label="Commodity"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    name={`${prefix}.weight`}
                    label="Weight (lbs)"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    name={`${prefix}.pieceCount`}
                    label="Pieces"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={stop.isHazmat ?? false}
                          onChange={(_e, checked) => {
                            void formik.setFieldValue(`${prefix}.isHazmat`, checked);
                          }}
                        />
                      }
                      label={<Typography variant="caption">Hazmat</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={stop.isTarp ?? false}
                          onChange={(_e, checked) => {
                            void formik.setFieldValue(`${prefix}.isTarp`, checked);
                          }}
                        />
                      }
                      label={<Typography variant="caption">Tarp</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={stop.isTempControlled ?? false}
                          onChange={(_e, checked) => {
                            void formik.setFieldValue(`${prefix}.isTempControlled`, checked);
                          }}
                        />
                      }
                      label={<Typography variant="caption">Temp Controlled</Typography>}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Contact */}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  name={`${prefix}.contactName`}
                  label="Contact Name"
                  formik={stopFormik}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name={`${prefix}.contactPhone`}
                  label="Contact Phone"
                  formik={stopFormik}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField name={`${prefix}.notes`} label="Notes" formik={stopFormik} />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Collapse>
    </MainCard>
  );
};
