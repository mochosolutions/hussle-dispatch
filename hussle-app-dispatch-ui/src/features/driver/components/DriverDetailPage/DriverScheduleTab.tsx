import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, parseISO } from 'date-fns';

import { EmptyState } from '@mocho/ui/components';
import SectionCard from 'components/SectionCard';
import type { WeeklyScheduleEntry, ScheduleOverride } from '../../types';
import { DAY_OF_WEEK_ORDER, DAY_OF_WEEK_LABELS } from '../../types';

interface DriverScheduleTabProps {
  weeklySchedule: WeeklyScheduleEntry[];
  overrides: ScheduleOverride[];
  isLoading: boolean;
  onEditWeekly: () => void;
  onAddOverride: () => void;
  onDeleteOverride: (overrideId: string) => void;
}

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  let display = h;
  if (h === 0) {
    display = 12;
  } else if (h > 12) {
    display = h - 12;
  }
  return `${display}:${minutes} ${suffix}`;
};

const OVERRIDE_TYPE_LABELS: Record<string, string> = {
  OFF: 'Day Off',
  MODIFIED: 'Modified Hours',
  ADDED: 'Extra Day',
};

const OVERRIDE_TYPE_COLORS: Record<string, 'error' | 'warning' | 'success'> = {
  OFF: 'error',
  MODIFIED: 'warning',
  ADDED: 'success',
};

export const DriverScheduleTab: React.FC<DriverScheduleTabProps> = ({
  weeklySchedule,
  overrides,
  isLoading,
  onEditWeekly,
  onAddOverride,
  onDeleteOverride,
}) => {
  const scheduleByDay = new Map(weeklySchedule.map((e) => [e.dayOfWeek, e]));

  return (
    <Box sx={{ p: 3, maxWidth: 1200, opacity: isLoading ? 0.5 : 1 }}>
      <Stack spacing={2.5}>
        {/* Weekly Schedule */}
        <SectionCard
          title="Weekly Schedule"
          actions={
            <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={onEditWeekly}>
              Edit Schedule
            </Button>
          }
        >
          <Box sx={{ px: 1.5, py: 1 }}>
            {weeklySchedule.length > 0 ? (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    {['Day', 'Hours'].map((header) => (
                      <Box
                        component="th"
                        key={header}
                        sx={{
                          textAlign: 'left',
                          py: 1,
                          px: 1.5,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {header}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {DAY_OF_WEEK_ORDER.map((day) => {
                    const entry = scheduleByDay.get(day);
                    return (
                      <Box component="tr" key={day}>
                        <Box component="td" sx={{ py: 1, px: 1.5, width: 160 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {DAY_OF_WEEK_LABELS[day]}
                          </Typography>
                        </Box>
                        <Box component="td" sx={{ py: 1, px: 1.5 }}>
                          {entry ? (
                            <Typography variant="body2">
                              {entry.is24Hours
                                ? '24 Hours'
                                : `${formatTime(entry.startTime)} \u2013 ${formatTime(entry.endTime)}`}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              Off
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <EmptyState title="No weekly schedule configured" />
            )}
          </Box>
        </SectionCard>

        {/* Schedule Overrides */}
        <SectionCard
          title="Schedule Overrides"
          actions={
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={onAddOverride}>
              Add Override
            </Button>
          }
        >
          <Box sx={{ px: 1.5, py: 1 }}>
            {overrides.length > 0 ? (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    {['Date', 'Type', 'Hours', 'Reason', ''].map((header) => (
                      <Box
                        component="th"
                        key={header || 'actions'}
                        sx={{
                          textAlign: 'left',
                          py: 1,
                          px: 1.5,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {header}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {overrides.map((override) => (
                    <Box component="tr" key={override.id}>
                      <Box component="td" sx={{ py: 1, px: 1.5, width: 140 }}>
                        <Typography variant="body2">
                          {format(parseISO(override.date), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ py: 1, px: 1.5, width: 140 }}>
                        <Chip
                          label={OVERRIDE_TYPE_LABELS[override.type] ?? override.type}
                          color={OVERRIDE_TYPE_COLORS[override.type] ?? 'default'}
                          size="small"
                          sx={{ height: 22, fontSize: '0.6875rem' }}
                        />
                      </Box>
                      <Box component="td" sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2">
                          {override.type !== 'OFF' && override.startTime && override.endTime
                            ? `${formatTime(override.startTime)} \u2013 ${formatTime(override.endTime)}`
                            : '\u2014'}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {override.reason ?? '\u2014'}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ py: 1, px: 1.5, width: 48 }}>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteOverride(override.id)}
                          aria-label="Delete override"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <EmptyState title="No schedule overrides" />
            )}
          </Box>
        </SectionCard>
      </Stack>
    </Box>
  );
};
