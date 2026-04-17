import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import InventoryIcon from '@mui/icons-material/Inventory';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { FormikProps } from 'formik';
import { MainCard, TextField, DateField, TimeField, PhoneField, NumericField } from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';
import type { StopsFormShape } from '../../validators/loadSchema';
import { SCHEDULING_TYPE_OPTIONS } from '../../constants';
import type { SchedulingType } from '../../constants';
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
  const schedulingType = (stop.schedulingType ?? 'APPOINTMENT') as SchedulingType;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasContactData = Boolean(stop.contactName || stop.contactPhone || stop.notes);
  const [showContact, setShowContact] = useState(hasContactData || schedulingType === 'NOTIFICATION');
  const hasCargoData = Boolean(
    stop.commodity || stop.weight || stop.pieceCount || stop.isHazmat || stop.isTarp || stop.isTempControlled,
  );
  const [showCargo, setShowCargo] = useState(hasCargoData);

  // Auto-expand contact when NOTIFICATION type is selected
  useEffect(() => {
    if (schedulingType === 'NOTIFICATION' && !showContact) {
      setShowContact(true);
    }
  }, [schedulingType, showContact]);

  // Auto-fill facility hours when date changes and place has stored hours
  const appointmentDate = stop.appointmentDate;
  const facilityHoursData = stop.facilityHoursData;
  useEffect(() => {
    if (
      (schedulingType === 'FCFS' || schedulingType === 'OPEN') &&
      facilityHoursData &&
      appointmentDate
    ) {
      const dayOfWeek = new Date(appointmentDate).getUTCDay();
      const hours = facilityHoursData as { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[];
      const dayEntry = hours.find((h) => h.dayOfWeek === dayOfWeek);
      if (dayEntry && !dayEntry.isClosed) {
        void formik.setFieldValue(`${prefix}.facilityOpenTime`, dayEntry.openTime);
        void formik.setFieldValue(`${prefix}.facilityCloseTime`, dayEntry.closeTime);
      }
    }
  }, [appointmentDate, schedulingType, facilityHoursData, formik, prefix]);

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

  const handleSchedulingTypeChange = useCallback(
    (_e: React.MouseEvent<HTMLElement>, value: SchedulingType | null) => {
      if (value === null) return;
      void formik.setFieldValue(`${prefix}.schedulingType`, value);

      // Clear fields not relevant to the new type
      if (value !== 'APPOINTMENT') {
        void formik.setFieldValue(`${prefix}.appointmentNumber`, '');
        if (value !== 'NOTIFICATION') {
          void formik.setFieldValue(`${prefix}.appointmentTime`, '');
        }
      }
      if (value !== 'FCFS' && value !== 'OPEN') {
        void formik.setFieldValue(`${prefix}.facilityOpenTime`, '');
        void formik.setFieldValue(`${prefix}.facilityCloseTime`, '');
      }
      if (value !== 'NOTIFICATION') {
        void formik.setFieldValue(`${prefix}.callByTime`, '');
      }
      if (value !== 'DROP_HOOK') {
        void formik.setFieldValue(`${prefix}.trailerNumber`, '');
        void formik.setFieldValue(`${prefix}.yardLocation`, '');
      }
    },
    [formik, prefix],
  );

  const activeHint = SCHEDULING_TYPE_OPTIONS.find((o) => o.value === schedulingType)?.hint ?? '';

  // Contact labels change for NOTIFICATION type
  const contactNameLabel = schedulingType === 'NOTIFICATION' ? 'Notify Contact' : 'Contact Name';
  const contactPhoneLabel = schedulingType === 'NOTIFICATION' ? 'Notify Phone' : 'Contact Phone';

  return (
    <MainCard
      content={false}
      sx={{
        borderLeft: '2px solid',
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

        <Box sx={{ backgroundColor: 'grey.100', p: 0.5 }}>
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

        {/* Scheduling type indicator */}
        <Chip
          label={SCHEDULING_TYPE_OPTIONS.find((o) => o.value === schedulingType)?.label ?? schedulingType}
          size="small"
          variant="outlined"
          sx={{ fontSize: 10, height: 20 }}
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

        {/* Type-aware badges */}
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
            label="No date"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        )}
        {schedulingType === 'APPOINTMENT' && !stop.appointmentTime && (
          <Chip
            label="No time"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        )}
        {schedulingType === 'APPOINTMENT' && !stop.appointmentNumber && (
          <Chip
            label="No appt #"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        )}
        {schedulingType === 'NOTIFICATION' && !stop.contactName && (
          <Chip
            label="No contact"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        )}
        {schedulingType === 'DROP_HOOK' && !stop.trailerNumber && (
          <Chip
            label="No trailer"
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
          <Stack spacing={1.5}>
            {/* Address search */}
            <AddressSearchField prefix={prefix} formik={formik} />

            {/* Scheduling type pill selector */}
            <Box>
              <ToggleButtonGroup
                value={schedulingType}
                exclusive
                onChange={handleSchedulingTypeChange}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 1.5,
                    py: 0.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  },
                }}
              >
                {SCHEDULING_TYPE_OPTIONS.map((opt) => (
                  <ToggleButton key={opt.value} value={opt.value} aria-label={opt.hint}>
                    {opt.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.disabled' }}>
                {activeHint}
              </Typography>
            </Box>

            {/* Conditional fields based on scheduling type */}

            {/* APPOINTMENT: Date | Time (req) | Appt # (req) */}
            {schedulingType === 'APPOINTMENT' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField name={`${prefix}.appointmentDate`} label="Date" formik={stopFormik} required />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.appointmentTime`} label="Appointment Time" formik={stopFormik} required />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField name={`${prefix}.appointmentNumber`} label="Appt #" formik={stopFormik} required />
                </Box>
              </Box>
            )}

            {/* FCFS: Date | Facility Open | Facility Close */}
            {schedulingType === 'FCFS' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField name={`${prefix}.appointmentDate`} label="Date" formik={stopFormik} required />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.facilityOpenTime`} label="Facility Opens" formik={stopFormik} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.facilityCloseTime`} label="Facility Closes" formik={stopFormik} />
                </Box>
              </Box>
            )}

            {/* NOTIFICATION: Date | Preferred Time | Call-by — then contact auto-shows below */}
            {schedulingType === 'NOTIFICATION' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField name={`${prefix}.appointmentDate`} label="Date" formik={stopFormik} required />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.appointmentTime`} label="Preferred Time" formik={stopFormik} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.callByTime`} label="Call By" formik={stopFormik} />
                </Box>
              </Box>
            )}

            {/* OPEN: Date | Facility Open | Facility Close */}
            {schedulingType === 'OPEN' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField name={`${prefix}.appointmentDate`} label="Date" formik={stopFormik} required />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.facilityOpenTime`} label="Facility Opens" formik={stopFormik} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.facilityCloseTime`} label="Facility Closes" formik={stopFormik} />
                </Box>
              </Box>
            )}

            {/* DROP_HOOK: Date | Trailer # | Yard Location */}
            {schedulingType === 'DROP_HOOK' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField name={`${prefix}.appointmentDate`} label="Date" formik={stopFormik} required />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField name={`${prefix}.trailerNumber`} label="Trailer #" formik={stopFormik} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField name={`${prefix}.yardLocation`} label="Yard Location" formik={stopFormik} />
                </Box>
              </Box>
            )}
          </Stack>

          {/* Cargo toggle (pickup only) */}
          {isPickup && (
            <Box sx={{ mt: 1.5 }}>
              <Button
                size="small"
                variant="text"
                startIcon={<InventoryIcon sx={{ fontSize: 16 }} />}
                onClick={() => setShowCargo((prev) => !prev)}
                sx={{ textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary' }}
              >
                {showCargo ? 'Hide cargo details' : 'Add cargo details'}
              </Button>
              <Collapse in={showCargo}>
                <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField name={`${prefix}.commodity`} label="Commodity" formik={stopFormik} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <NumericField name={`${prefix}.weight`} label="Weight" suffix="lbs" formik={stopFormik} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <NumericField name={`${prefix}.pieceCount`} label="Pieces" formik={stopFormik} />
                    </Box>
                  </Box>
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
                </Stack>
              </Collapse>
            </Box>
          )}

          {/* Contact toggle */}
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<ContactPhoneIcon sx={{ fontSize: 16 }} />}
              onClick={() => setShowContact((prev) => !prev)}
              sx={{ textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary' }}
            >
              {showContact ? 'Hide contact & notes' : 'Add contact & notes'}
            </Button>
            <Collapse in={showContact}>
              <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      name={`${prefix}.contactName`}
                      label={contactNameLabel}
                      formik={stopFormik}
                      required={schedulingType === 'NOTIFICATION'}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <PhoneField
                      name={`${prefix}.contactPhone`}
                      label={contactPhoneLabel}
                      formik={stopFormik}
                      required={schedulingType === 'NOTIFICATION'}
                    />
                  </Box>
                </Box>
                <TextField name={`${prefix}.notes`} label="Notes" formik={stopFormik} />
              </Stack>
            </Collapse>
          </Box>
        </Box>
      </Collapse>
    </MainCard>
  );
};
