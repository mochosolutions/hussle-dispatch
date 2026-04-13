import { Button, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// import InsightsIcon from '@mui/icons-material/Insights';
import MapIcon from '@mui/icons-material/Map';
// import PeopleIcon from '@mui/icons-material/People';
import TableChartIcon from '@mui/icons-material/TableChart';
// import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import type { BoardView } from '../../../types';

export interface DispatchBoardActionsProps {
  boardView: BoardView;
  handleViewChange: (event: React.MouseEvent<HTMLElement>, value: BoardView | null) => void;
  handleCreateLoad: () => void;
}

export const DispatchBoardActions = ({
  boardView,
  handleViewChange,
  handleCreateLoad,
}: DispatchBoardActionsProps) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <ToggleButtonGroup
        value={boardView}
        exclusive
        onChange={handleViewChange}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            px: 2,
            py: 0.75,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: '#fff',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          },
        }}
      >
        <ToggleButton value="table" aria-label="Table view">
          <TableChartIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Table
        </ToggleButton>
        {/* Kanban and Driver views hidden — code preserved for future re-enable
        <ToggleButton value="kanban" aria-label="Kanban view">
          <ViewKanbanIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Kanban
        </ToggleButton>
        <ToggleButton value="driver" aria-label="Driver view">
          <PeopleIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Driver
        </ToggleButton>
        <ToggleButton value="intel" aria-label="Intel view">
          <InsightsIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Intel
        </ToggleButton>
        */}
        <ToggleButton value="map" aria-label="Map view">
          <MapIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Map
        </ToggleButton>
      </ToggleButtonGroup>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateLoad}>
        Create Load
      </Button>
    </Stack>
  );
};
