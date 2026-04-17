import { Button, Chip, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SectionCard from 'components/SectionCard';
import { AvatarChip } from 'components/AvatarChip';
import { SectionLabel, BodyStrong } from 'components/Typography';
import type { LoadDetail } from '../../../types';
import { formatEquipmentType } from '../../../constants';

interface AssignmentCardProps {
  load: LoadDetail;
  onEdit: () => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ load, onEdit }) => {
  const { assignment } = load;
  const driverName = assignment.driver
    ? `${assignment.driver.firstName} ${assignment.driver.lastName}`
    : null;

  const vehicleLabel = assignment.vehicle
    ? `#${assignment.vehicle.unitNumber} \u2014 ${formatEquipmentType(assignment.vehicle.type)}`
    : null;

  return (
    <SectionCard
      title="Assignment"
      actions={
        <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEdit}>
          Edit
        </Button>
      }
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <SectionLabel>Carrier</SectionLabel>
          {assignment.carrier ? (
            <AvatarChip name={assignment.carrier.name} size="small" sx={{ mt: 0.5 }} />
          ) : (
            <BodyStrong>{'\u2014'}</BodyStrong>
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SectionLabel>Driver</SectionLabel>
          <BodyStrong>{driverName ?? '\u2014'}</BodyStrong>
          {assignment.isTeamDriver && (
            <Chip
              label="Team"
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SectionLabel>Vehicle</SectionLabel>
          <BodyStrong>{vehicleLabel ?? '\u2014'}</BodyStrong>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SectionLabel>Equipment</SectionLabel>
          <BodyStrong>{formatEquipmentType(load.equipmentType)}</BodyStrong>
        </Grid>
      </Grid>
    </SectionCard>
  );
};
