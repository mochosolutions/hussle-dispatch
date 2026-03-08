import { Box } from '@mui/material';

import type { LoadFilters, MockDriver, MockLoad } from '../../types';
import { InnerPageHeader } from '../../../../components/InnerPageHeader';
import { LoadIntelligenceActions } from '../LoadIntelligenceActions';
import DriverFilterStrip from '../DriverFilterStrip';
import StatsFilterBar from '../StatsFilterBar';

interface LoadIntelligenceHeaderProps {
  onCreateLoad: () => void;
  onAddManually: () => void;
  drivers: MockDriver[];
  selectedDriverId: string | null;
  onDriverSelect: (id: string | null) => void;
  loads: MockLoad[];
  filters: LoadFilters;
  onFilterChange: (filters: LoadFilters) => void;
}

export const LoadIntelligenceHeader: React.FC<LoadIntelligenceHeaderProps> = ({
  onCreateLoad,
  onAddManually,
  drivers,
  selectedDriverId,
  onDriverSelect,
  loads,
  filters,
  onFilterChange,
}) => {
  return (
    <Box
      sx={{
        px: 4,
        pt: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <InnerPageHeader
        title="Load Intelligence"
        actions={
          <LoadIntelligenceActions onCreateLoad={onCreateLoad} onAddManually={onAddManually} />
        }
      />
      {/* <DriverFilterStrip
        drivers={drivers}
        selectedDriverId={selectedDriverId}
        onSelectDriver={onDriverSelect}
      /> */}
      <StatsFilterBar loads={loads} filters={filters} onFilterChange={onFilterChange} />
    </Box>
  );
};
