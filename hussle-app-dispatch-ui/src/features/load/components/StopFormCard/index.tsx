import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { FieldArray } from 'formik';
import type { FormikProps } from 'formik';
import {
  MainCard,
  TextField,
  DateField,
  TimeField,
} from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';
import type { LoadFormValues } from '../../validators/loadSchema';
import { AddressSearchField } from '../AddressSearchField';
import type { CommoditySummary } from '../../types';

interface StopFormCardProps {
  index: number;
  prefix: string;
  formik: FormikProps<LoadFormValues>;
  canRemove: boolean;
  onRemove: () => void;
  allPickupCommodities: CommoditySummary[];
  defaultExpanded?: boolean;
}

const EMPTY_COMMODITY = {
  description: '',
  weight: '',
  pieces: '',
  nmfc: '',
  isHazmat: false,
  isTarp: false,
  isTempControlled: false,
};

export const StopFormCard: React.FC<StopFormCardProps> = ({
  index,
  prefix,
  formik,
  canRemove,
  onRemove,
  allPickupCommodities,
  defaultExpanded = false,
}) => {
  const stop = formik.values.stops[index];
  const isPickup = stop.type === 'PICKUP';
  const accentColor = isPickup ? 'primary.main' : 'success.main';
  const accentBg = isPickup ? 'primary.50' : 'success.50';
  const stopLabel = isPickup ? 'Pickup stop' : 'Delivery stop';

  const [expanded, setExpanded] = useState(defaultExpanded);

  // Auto-expand when validation errors exist for this stop after submit attempt
  const stopErrors = formik.errors.stops?.[index];
  const stopTouched = formik.touched.stops?.[index];
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

  const commodities = stop.commodities ?? [];

  const commoditySummary = commodities.length > 0
    ? `${commodities.length} item${commodities.length > 1 ? 's' : ''}`
    : null;

  return (
    <MainCard
      content={false}
      sx={{
        // border: '1px solid',
        borderColor: 'divider',
        border: `2px solid`,
        borderColor: accentColor,
        borderRadius: 1,
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
        {/* Drag handle */}
        <Box
          aria-label="Drag to reorder"
          sx={{
            alignItems: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.75,
            color: 'text.secondary',
            cursor: 'grab',
            display: 'inline-flex',
            height: 22,
            justifyContent: 'center',
            width: 22,
          }}
        >
          <Box
            sx={{
              columnGap: 0.35,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              rowGap: 0.35,
            }}
          >
            {Array.from({ length: 6 }).map((_, dotIdx) => (
              <Box
                key={`drag-dot-${dotIdx}`}
                sx={{
                  backgroundColor: 'text.secondary',
                  borderRadius: '50%',
                  height: 3,
                  width: 3,
                }}
              />
            ))}
          </Box>
        </Box>

        <Typography color="text.secondary" sx={{ minWidth: 16 }} variant="caption">
          {index + 1}
        </Typography>

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
          <Chip label="No facility" size="small" color="error" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
        )}
        {!stop.appointmentDate && (
          <Chip label="No appt" size="small" color="warning" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
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
            <Grid item xs={12} md={2.2}>
              <DateField name={`${prefix}.appointmentDate`} label="Date" formik={stopFormik} />
            </Grid>
            <Grid item xs={12} md={2.2}>
              <TimeField name={`${prefix}.appointmentTime`} label="Time" formik={stopFormik} />
            </Grid>
          </Grid>

          {/* Commodity section (pickup) */}
          {isPickup && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Commodities
              </Typography>
              <FieldArray name={`${prefix}.commodities`}>
                {(arrayHelpers) => (
                  <Stack spacing={1}>
                    {commodities.map((commodity, cIdx) => (
                      <Box
                        key={cIdx}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1.5,
                        }}
                      >
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <TextField
                              name={`${prefix}.commodities[${cIdx}].description`}
                              label="Commodity"
                              formik={stopFormik}
                            />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <TextField
                              name={`${prefix}.commodities[${cIdx}].weight`}
                              label="Weight (lbs)"
                              formik={stopFormik}
                            />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <TextField
                              name={`${prefix}.commodities[${cIdx}].pieces`}
                              label="Pieces"
                              formik={stopFormik}
                            />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <TextField
                              name={`${prefix}.commodities[${cIdx}].nmfc`}
                              label="NMFC"
                              formik={stopFormik}
                            />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <IconButton
                              size="small"
                              onClick={() => arrayHelpers.remove(cIdx)}
                              aria-label={`Remove commodity ${cIdx + 1}`}
                            >
                              <DeleteOutlineIcon fontSize="small" color="error" />
                            </IconButton>
                          </Grid>
                          <Grid item xs={12}>
                            <Stack direction="row" spacing={2}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={commodity.isHazmat ?? false}
                                    onChange={(_e, checked) => {
                                      void formik.setFieldValue(
                                        `${prefix}.commodities[${cIdx}].isHazmat`,
                                        checked,
                                      );
                                    }}
                                  />
                                }
                                label={<Typography variant="caption">Hazmat</Typography>}
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={commodity.isTarp ?? false}
                                    onChange={(_e, checked) => {
                                      void formik.setFieldValue(
                                        `${prefix}.commodities[${cIdx}].isTarp`,
                                        checked,
                                      );
                                    }}
                                  />
                                }
                                label={<Typography variant="caption">Tarp</Typography>}
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={commodity.isTempControlled ?? false}
                                    onChange={(_e, checked) => {
                                      void formik.setFieldValue(
                                        `${prefix}.commodities[${cIdx}].isTempControlled`,
                                        checked,
                                      );
                                    }}
                                  />
                                }
                                label={<Typography variant="caption">Temp Controlled</Typography>}
                              />
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => arrayHelpers.push({ ...EMPTY_COMMODITY })}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                      Add Commodity
                    </Button>
                  </Stack>
                )}
              </FieldArray>
            </Box>
          )}

          {/* Freight receiving (delivery) */}
          {!isPickup && allPickupCommodities.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Freight Receiving
              </Typography>
              <Stack spacing={0.5}>
                {allPickupCommodities.map((c) => (
                  <FormControlLabel
                    key={c.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={(stop.receivingCommodityIds ?? []).includes(c.id)}
                        onChange={(_e, checked) => {
                          const current = stop.receivingCommodityIds ?? [];
                          const next = checked
                            ? [...current, c.id]
                            : current.filter((id) => id !== c.id);
                          void formik.setFieldValue(`${prefix}.receivingCommodityIds`, next);
                        }}
                      />
                    }
                    label={
                      <Typography variant="caption">
                        {c.description || 'Unnamed'} {c.weight ? `\u2014 ${c.weight} lbs` : ''}
                      </Typography>
                    }
                  />
                ))}
              </Stack>
            </Box>
          )}

        </Box>
      </Collapse>
    </MainCard>
  );
};
