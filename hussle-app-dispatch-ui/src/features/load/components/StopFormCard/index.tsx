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
import type { FormikProps } from 'formik';
import {
  MainCard,
  TextField,
  DateField,
  TimeField,
  PhoneField,
  NumericField,
} from '@mocho/ui/components';
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
  const stopLabel = isPickup ? 'Pickup' : 'Delivery';
  const schedulingType = (stop.schedulingType ?? 'APPOINTMENT') as SchedulingType;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasContactData = Boolean(stop.contactName || stop.contactPhone || stop.notes);
  const [showContact, setShowContact] = useState(
    hasContactData || schedulingType === 'NOTIFICATION',
  );
  const hasCargoData = Boolean(
    stop.commodity ||
    stop.weight ||
    stop.pieceCount ||
    stop.isHazmat ||
    stop.isTarp ||
    stop.isTempControlled,
  );
  const [showCargo, setShowCargo] = useState(hasCargoData);

  // Auto-expand contact when NOTIFICATION type is selected
  useEffect(() => {
    if (schedulingType === 'NOTIFICATION' && !showContact) {
      setShowContact(true);
    }
  }, [schedulingType, showContact]);

  // Auto-expand when validation errors exist for this stop after submit attempt
  const stopErrors = formik.errors.stops?.[index];
  useEffect(() => {
    if (formik.submitCount > 0 && stopErrors && !expanded) {
      setExpanded(true);
    }
  }, [formik.submitCount, stopErrors, expanded]);

  const stopFormik = formik;

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

  const schedulingLabel =
    SCHEDULING_TYPE_OPTIONS.find((o) => o.value === schedulingType)?.label ?? schedulingType;

  const locationSummary =
    stop.city && stop.state ? `${stop.city}, ${stop.state.toUpperCase()}` : null;

  const facilitySummary = stop.facilityName || locationSummary || 'No facility';

  return (
    <MainCard
      content={false}
      sx={{
        borderLeft: '3px solid',
        borderLeftColor: accentColor,
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header — clickable to toggle expand */}
      <Box
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background-color 0.15s',
        }}
      >
        {/* Top row: controls + summary */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 1,
            minHeight: 44,
          }}
        >
          {/* Reorder arrows */}
          {canReorder && (
            <Stack
              direction="column"
              spacing={0}
              sx={{ mr: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton
                size="small"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label="Move stop up"
                sx={{ p: 0.125 }}
              >
                <ArrowUpwardIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label="Move stop down"
                sx={{ p: 0.125 }}
              >
                <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Stack>
          )}

          {/* Sequence + type badge */}
          <Chip
            size="small"
            label={`${index + 1}. ${stopLabel}`}
            sx={{
              backgroundColor: accentColor,
              color: 'common.white',
              fontWeight: 700,
              fontSize: 11,
              height: 22,
              flexShrink: 0,
            }}
          />

          {/* Scheduling type */}
          <Chip
            label={schedulingLabel}
            size="small"
            variant="outlined"
            sx={{ fontSize: 10, height: 20, flexShrink: 0 }}
          />

          {/* Facility / location — truncated */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: stop.facilityName ? 'text.primary' : 'text.disabled',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flex: 1,
            }}
          >
            {facilitySummary}
          </Typography>

          {/* Date indicator — compact */}
          {!stop.appointmentDate && (
            <Typography
              variant="caption"
              sx={{
                color: 'warning.main',
                fontWeight: 600,
                fontSize: 10,
                flexShrink: 0,
              }}
            >
              No date
            </Typography>
          )}

          {/* Expand chevron — rotates */}
          <ExpandMoreIcon
            fontSize="small"
            sx={{
              color: 'text.secondary',
              flexShrink: 0,
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />

          {/* Action buttons — stop click propagation */}
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ display: 'flex', gap: 0.25, flexShrink: 0, ml: -0.5 }}
          >
            {canRemove && (
              <IconButton
                size="small"
                onClick={onRemove}
                aria-label={`Remove stop ${index + 1}`}
                sx={{ p: 0.5 }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16 }} color="error" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Address search */}
            <AddressSearchField prefix={prefix} formik={formik} />

            {/* Scheduling type pill selector */}
            <Box>
              <ToggleButtonGroup
                value={schedulingType}
                exclusive
                onChange={handleSchedulingTypeChange}
                size="small"
                fullWidth
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
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.disabled' }}
              >
                {activeHint}
              </Typography>
            </Box>

            {/* Conditional fields based on scheduling type */}

            {/* APPOINTMENT: Date | Time (req) | Appt # (optional) */}
            {schedulingType === 'APPOINTMENT' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField
                    name={`${prefix}.appointmentDate`}
                    label="Date"
                    formik={stopFormik}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField
                    name={`${prefix}.appointmentTime`}
                    label="Time"
                    formik={stopFormik}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    name={`${prefix}.appointmentNumber`}
                    label="Appt #"
                    formik={stopFormik}
                  />
                </Box>
              </Box>
            )}

            {/* FCFS: Date | Time */}
            {schedulingType === 'FCFS' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField
                    name={`${prefix}.appointmentDate`}
                    label="Date"
                    formik={stopFormik}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField
                    name={`${prefix}.appointmentTime`}
                    label="Arrival Time"
                    formik={stopFormik}
                  />
                </Box>
              </Box>
            )}

            {/* NOTIFICATION: Date | Preferred Time | Call-by */}
            {schedulingType === 'NOTIFICATION' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField
                    name={`${prefix}.appointmentDate`}
                    label="Date"
                    formik={stopFormik}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField
                    name={`${prefix}.appointmentTime`}
                    label="Preferred Time"
                    formik={stopFormik}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField name={`${prefix}.callByTime`} label="Call By" formik={stopFormik} />
                </Box>
              </Box>
            )}

            {/* OPEN: Date | Time */}
            {schedulingType === 'OPEN' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField
                    name={`${prefix}.appointmentDate`}
                    label="Date"
                    formik={stopFormik}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TimeField
                    name={`${prefix}.appointmentTime`}
                    label="Arrival Time"
                    formik={stopFormik}
                  />
                </Box>
              </Box>
            )}

            {/* DROP_HOOK: Date | Trailer # | Yard Location */}
            {schedulingType === 'DROP_HOOK' && (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <DateField
                    name={`${prefix}.appointmentDate`}
                    label="Date"
                    formik={stopFormik}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    name={`${prefix}.trailerNumber`}
                    label="Trailer #"
                    formik={stopFormik}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    name={`${prefix}.yardLocation`}
                    label="Yard Location"
                    formik={stopFormik}
                  />
                </Box>
              </Box>
            )}
          </Stack>

          {/* Cargo toggle (pickup only) */}
          {isPickup && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="text"
                startIcon={<InventoryIcon sx={{ fontSize: 16 }} />}
                onClick={() => setShowCargo((prev) => !prev)}
                sx={{ textTransform: 'none', fontSize: '0.8125rem', color: 'text.secondary' }}
              >
                {showCargo ? 'Hide cargo details' : 'Add cargo details'}
              </Button>
              <Collapse in={showCargo}>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        name={`${prefix}.commodity`}
                        label="Commodity"
                        formik={stopFormik}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <NumericField
                        name={`${prefix}.weight`}
                        label="Weight"
                        suffix="lbs"
                        formik={stopFormik}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <NumericField
                        name={`${prefix}.pieceCount`}
                        label="Pieces"
                        formik={stopFormik}
                      />
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
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<ContactPhoneIcon sx={{ fontSize: 16 }} />}
              onClick={() => setShowContact((prev) => !prev)}
              sx={{ textTransform: 'none', fontSize: '0.8125rem', color: 'text.secondary' }}
            >
              {showContact ? 'Hide contact & notes' : 'Add contact & notes'}
            </Button>
            <Collapse in={showContact}>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
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
