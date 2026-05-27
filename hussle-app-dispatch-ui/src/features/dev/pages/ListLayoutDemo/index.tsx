import { Box, Button, Chip, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ListLayout } from 'components/ListLayout';
import { ActionMenu } from 'components/ActionMenu';
import { StatusBadge } from 'components/Statusbadge';
import { TwoLineCell, Amount, LinkText, Meta, TableHeaderLabel } from 'components/Typography';

const noop = () => {
  // placeholder for demo callbacks
};

interface MockRow {
  id: string;
  loadNumber: string;
  route: string;
  distance: string;
  status: string;
  carrier: string;
  carrierSub: string;
  rate: string;
  pickup: string;
  flagged?: boolean;
}

const MOCK_ROWS: MockRow[] = [
  {
    id: '1',
    loadNumber: 'LD-2026-000007',
    route: 'Newark, NJ → Dallas, TX',
    distance: '1,547 mi · Dry Van',
    status: 'IN_TRANSIT',
    carrier: 'Swift Transport LLC',
    carrierSub: 'MC# 123456',
    rate: '$4,254.25',
    pickup: 'Mar 18, 8:00 AM',
  },
  {
    id: '2',
    loadNumber: 'LD-2026-000008',
    route: 'Chicago, IL → Atlanta, GA',
    distance: '716 mi · Flatbed',
    status: 'BOOKED',
    carrier: 'JB Hunt Transport',
    carrierSub: 'MC# 789012',
    rate: '$2,148.00',
    pickup: 'Mar 19, 6:00 AM',
  },
  {
    id: '3',
    loadNumber: 'LD-2026-000009',
    route: 'Los Angeles, CA → Phoenix, AZ',
    distance: '372 mi · Reefer',
    status: 'DELIVERED',
    carrier: 'Werner Enterprises',
    carrierSub: 'MC# 345678',
    rate: '$1,488.00',
    pickup: 'Mar 15, 10:00 AM',
  },
  {
    id: '4',
    loadNumber: 'LD-2026-000010',
    route: 'Houston, TX → Memphis, TN',
    distance: '586 mi · Dry Van',
    status: 'EXCEPTION',
    carrier: 'Heartland Express',
    carrierSub: 'MC# 901234',
    rate: '$1,758.00',
    pickup: 'Mar 17, 7:00 AM',
    flagged: true,
  },
];

const COLUMNS = ['Load #', 'Route', 'Status', 'Carrier', 'Rate', 'Pickup', ''];

const ListLayoutDemo = () => (
  <ListLayout
    title="Loads"
    primaryAction={
      <Button variant="contained" startIcon={<AddIcon />} size="small">
        Create Load
      </Button>
    }
    toolbar={
      <Box
        sx={{
          bgcolor: 'grey.100',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          placeholder="Search loads..."
          sx={{ width: 260, bgcolor: 'background.paper' }}
        />
        <Chip label="All Statuses" variant="outlined" size="small" />
        <Chip label="This Week" variant="outlined" size="small" />
        <Chip label="Dry Van" variant="outlined" size="small" />
      </Box>
    }
  >
    <Box
      sx={{
        m: { xs: 2, sm: 3 },
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Table header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 140px 180px 110px 130px 48px',
          bgcolor: 'grey.100',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          px: 2,
          py: 1,
        }}
      >
        {COLUMNS.map((col) => (
          <TableHeaderLabel key={col}>{col}</TableHeaderLabel>
        ))}
      </Box>

      {/* Rows */}
      {MOCK_ROWS.map((row) => (
        <Box
          key={row.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 140px 180px 110px 130px 48px',
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            alignItems: 'center',
            bgcolor: row.flagged ? 'rgba(217, 119, 6, 0.04)' : 'transparent',
            '&:hover': { bgcolor: 'grey.100' },
            '&:last-child': { borderBottom: 'none' },
          }}
        >
          <LinkText>{row.loadNumber}</LinkText>
          <TwoLineCell primary={row.route} secondary={row.distance} />
          <StatusBadge status={row.status} size="small" />
          <TwoLineCell primary={row.carrier} secondary={row.carrierSub} />
          <Amount>{row.rate}</Amount>
          <Meta>{row.pickup}</Meta>
          <ActionMenu
            items={[
              { label: 'View Details', onClick: noop },
              { label: 'Edit', onClick: noop },
              { label: 'Cancel Load', onClick: noop, danger: true },
            ]}
          />
        </Box>
      ))}

      {/* Footer */}
      <Box
        sx={{
          bgcolor: 'grey.100',
          borderTop: '1px solid',
          borderColor: 'grey.200',
          px: 2,
          py: 1,
        }}
      >
        <Meta>Showing 1-4 of 4 loads</Meta>
      </Box>
    </Box>
  </ListLayout>
);

export default ListLayoutDemo;
