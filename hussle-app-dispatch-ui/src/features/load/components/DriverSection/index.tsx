import { Chip, Grid, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { FormikProps } from 'formik';
import SectionCard from 'components/SectionCard';
import type { LoadFormValues } from '../../validators/loadSchema';
import type { SelectedDriverInfo } from '../../types';
import AssignmentFieldGroup from '../AssignmentFieldGroup';

interface DriverSectionProps {
  formik: FormikProps<LoadFormValues>;
  onDriverSelected: (driver: SelectedDriverInfo | null) => void;
  selectedDriver: SelectedDriverInfo | null;
  complete?: boolean;
}

const getDriverBadge = (driver: SelectedDriverInfo) => {
  if (driver.type === 'owner_operator') {
    return { label: '1099 \u2014 Owner Op', color: 'success' as const };
  }
  return { label: 'W2 \u2014 Company Driver', color: 'primary' as const };
};

export const DriverSection: React.FC<DriverSectionProps> = ({
  formik,
  onDriverSelected: _onDriverSelected,
  selectedDriver,
  complete,
}) => {
  const driverBadge = selectedDriver ? getDriverBadge(selectedDriver) : null;

  return (
    <SectionCard
      title="Driver & Asset"
      subtitle="Assign a carrier, driver, and vehicle to this load"
      actions={
        complete || driverBadge ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            {complete && (
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
            )}
            {driverBadge && (
              <Chip
                label={driverBadge.label}
                color={driverBadge.color}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>
        ) : undefined
      }
    >
      <Grid container spacing={1.5}>
        <AssignmentFieldGroup formik={formik} />

        {selectedDriver && (
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Driver:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedDriver.name}
              </Typography>
            </Stack>
          </Grid>
        )}
      </Grid>
    </SectionCard>
  );
};
