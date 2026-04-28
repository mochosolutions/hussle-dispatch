import { useMemo, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import {
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { EmptyState, MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';

type CarrierType = 'COMPANY_ASSET' | 'EXTERNAL';
type CarrierStatus = 'ACTIVE' | 'PENDING' | 'ONBOARDING' | 'INACTIVE';
type CarrierTab = 'all' | 'company' | 'external';

interface Carrier {
  id: number;
  name: string;
  mc: string;
  dot: string;
  type: CarrierType;
  contact: string;
  phone: string;
  status: CarrierStatus;
  drivers: number;
  vehicles: number;
  revenue: number;
  activeLoads: number;
}

interface CarrierCellParams {
  value: unknown;
  data: Carrier;
}

const seedCarriers: Carrier[] = [
  {
    id: 1,
    name: 'Hustle Transportation',
    mc: 'MC-0981234',
    dot: 'DOT-3456789',
    type: 'COMPANY_ASSET',
    contact: 'Jr Rodriguez',
    phone: '(555) 100-2000',
    status: 'ACTIVE',
    drivers: 3,
    vehicles: 3,
    revenue: 84200,
    activeLoads: 4,
  },
  {
    id: 2,
    name: 'JR Express LLC',
    mc: 'MC-1234567',
    dot: 'DOT-9876543',
    type: 'EXTERNAL',
    contact: 'Jr Rodriguez',
    phone: '(555) 123-4567',
    status: 'ACTIVE',
    drivers: 2,
    vehicles: 2,
    revenue: 12800,
    activeLoads: 1,
  },
  {
    id: 3,
    name: 'Summit Freight LLC',
    mc: 'MC-2345678',
    dot: 'DOT-8765432',
    type: 'EXTERNAL',
    contact: 'Andre Hill',
    phone: '(555) 234-5678',
    status: 'ACTIVE',
    drivers: 2,
    vehicles: 2,
    revenue: 8400,
    activeLoads: 2,
  },
  {
    id: 4,
    name: 'Apex Carriers Inc',
    mc: 'MC-3456789',
    dot: 'DOT-7654321',
    type: 'EXTERNAL',
    contact: 'Luis Garcia',
    phone: '(555) 345-6789',
    status: 'ACTIVE',
    drivers: 2,
    vehicles: 2,
    revenue: 6200,
    activeLoads: 1,
  },
  {
    id: 5,
    name: 'Metro Haulers LLC',
    mc: 'MC-4567890',
    dot: 'DOT-6543210',
    type: 'EXTERNAL',
    contact: 'Dwayne Carter',
    phone: '(555) 456-7890',
    status: 'PENDING',
    drivers: 0,
    vehicles: 0,
    revenue: 0,
    activeLoads: 0,
  },
  {
    id: 6,
    name: 'Liberty Transport Co',
    mc: 'MC-5678901',
    dot: 'DOT-5432109',
    type: 'EXTERNAL',
    contact: 'Maria Santos',
    phone: '(555) 567-8901',
    status: 'PENDING',
    drivers: 1,
    vehicles: 1,
    revenue: 0,
    activeLoads: 0,
  },
  {
    id: 7,
    name: 'Eagle Logistics LLC',
    mc: 'MC-6789012',
    dot: 'DOT-4321098',
    type: 'EXTERNAL',
    contact: 'Kevin Brown',
    phone: '(555) 678-9012',
    status: 'ONBOARDING',
    drivers: 0,
    vehicles: 0,
    revenue: 0,
    activeLoads: 0,
  },
  {
    id: 8,
    name: 'Swift Line Hauling',
    mc: 'MC-1122334',
    dot: 'DOT-9988776',
    type: 'EXTERNAL',
    contact: 'Chris Martin',
    phone: '(555) 112-2334',
    status: 'INACTIVE',
    drivers: 1,
    vehicles: 1,
    revenue: 3100,
    activeLoads: 0,
  },
];

const generatedNames = [
  'Atlas Freight Lines',
  'Blue Ridge Logistics',
  'Canyon Star Transport',
  'Delta Haul Network',
  'Evergreen Route Co',
  'Frontier Cargo Group',
  'Granite Peak Carriers',
  'Harbor Line Transit',
  'Ironclad Trucking',
  'Jetstream Freight Co',
];

const generatedContacts = [
  'Alex Turner',
  'Brianna Lopez',
  'Carlos Rivera',
  'Danielle Kim',
  'Ethan Brooks',
  'Fatima Ali',
  'George Hall',
  'Hannah Scott',
  'Isaac Morgan',
  'Jasmine Reed',
];

const statusCycle: CarrierStatus[] = ['ACTIVE', 'PENDING', 'ONBOARDING', 'INACTIVE'];

const generatedCarriers: Carrier[] = Array.from({ length: 112 }, (_item, index) => {
  const recordId = index + 9;
  const generatedIndex = index % generatedNames.length;
  const status = statusCycle[index % statusCycle.length];
  const type: CarrierType = recordId % 10 === 0 ? 'COMPANY_ASSET' : 'EXTERNAL';
  const drivers = status === 'INACTIVE' ? 0 : (index % 5) + 1;
  const vehicles = status === 'INACTIVE' ? 0 : (index % 4) + 1;
  const activeLoads = status === 'ACTIVE' ? (index % 6) + 1 : 0;
  const revenue = status === 'INACTIVE' ? 0 : 4000 + (index % 12) * 1750;
  const mcCode = String(3000000 + recordId).padStart(7, '0');
  const dotCode = String(7000000 + recordId).padStart(7, '0');
  const phoneNumber = String(2000 + index).padStart(4, '0');

  return {
    id: recordId,
    name: `${generatedNames[generatedIndex]} ${recordId}`,
    mc: `MC-${mcCode}`,
    dot: `DOT-${dotCode}`,
    type,
    contact: generatedContacts[generatedIndex],
    phone: `(555) 88${phoneNumber.slice(0, 2)}-${phoneNumber.slice(2, 4)}`,
    status,
    drivers,
    vehicles,
    revenue,
    activeLoads,
  };
});

const carriers: Carrier[] = [...seedCarriers, ...generatedCarriers];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const Fleet = () => {
  const [activeTab, setActiveTab] = useState<CarrierTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCarriers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return carriers.filter((carrier) => {
      if (activeTab === 'company' && carrier.type !== 'COMPANY_ASSET') {
        return false;
      }

      if (activeTab === 'external' && carrier.type !== 'EXTERNAL') {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        carrier.name.toLowerCase().includes(normalizedQuery) ||
        carrier.mc.toLowerCase().includes(normalizedQuery) ||
        carrier.contact.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeTab, searchQuery]);

  const kpiData = useMemo(() => {
    const activeCount = carriers.filter((carrier) => carrier.status === 'ACTIVE').length;
    const totalDrivers = carriers.reduce((sum, carrier) => sum + carrier.drivers, 0);
    const totalVehicles = carriers.reduce((sum, carrier) => sum + carrier.vehicles, 0);
    const totalRevenue = carriers.reduce((sum, carrier) => sum + carrier.revenue, 0);

    return [
      {
        label: 'Total Carriers',
        value: String(carriers.length),
        subtitle: `${activeCount} active`,
      },
      {
        label: 'Total Drivers',
        value: String(totalDrivers),
        subtitle: 'Across all carriers',
      },
      {
        label: 'Total Vehicles',
        value: String(totalVehicles),
        subtitle: 'Across all carriers',
      },
      {
        label: 'Lifetime Revenue',
        value: currencyFormatter.format(totalRevenue),
        subtitle: 'All carriers combined',
      },
    ];
  }, []);

  const tabOptions = useMemo(
    () => [
      { key: 'all' as const, label: 'All', count: carriers.length },
      {
        key: 'company' as const,
        label: 'Company Asset',
        count: carriers.filter((carrier) => carrier.type === 'COMPANY_ASSET').length,
      },
      {
        key: 'external' as const,
        label: 'External Carrier',
        count: carriers.filter((carrier) => carrier.type === 'EXTERNAL').length,
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      sortable: true,
      resizable: true,
      filter: false,
    }),
    [],
  );

  const columnDefs = useMemo<ColDef<Carrier>[]>(
    () => [
      {
        headerName: 'Carrier',
        field: 'name',
        minWidth: 280,
        flex: 1.6,
        cellRenderer: ({ data }: CarrierCellParams) => {
          const initials = data.name
            .split(' ')
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join('');

          return (
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1,
                  backgroundColor:
                    data.type === 'COMPANY_ASSET' ? 'primary.lighter' : 'success.lighter',
                  color: data.type === 'COMPANY_ASSET' ? 'primary.main' : 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  typography: 'caption',
                  fontWeight: 700,
                }}
              >
                {initials}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.primary">
                  {data.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`${data.mc} · ${data.dot}`}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 160,
        cellRenderer: ({ value }: CarrierCellParams) => {
          const isCompanyAsset = value === 'COMPANY_ASSET';
          const label = isCompanyAsset ? 'Company Asset' : 'External';
          const color = isCompanyAsset ? 'secondary' : 'info';

          return (
            <Chip
              label={label}
              size="small"
              color={color}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        headerName: 'Contact',
        field: 'contact',
        minWidth: 180,
        cellRenderer: ({ data }: CarrierCellParams) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
              {data.contact}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.phone}
            </Typography>
          </Box>
        ),
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 150,
        cellRenderer: ({ value }: CarrierCellParams) => {
          const status = String(value);
          let chipColor: 'success' | 'warning' | 'info' | 'default' = 'default';

          if (status === 'ACTIVE') {
            chipColor = 'success';
          } else if (status === 'PENDING') {
            chipColor = 'warning';
          } else if (status === 'ONBOARDING') {
            chipColor = 'info';
          }

          return (
            <Chip
              label={status.charAt(0) + status.slice(1).toLowerCase()}
              size="small"
              color={chipColor}
              variant="filled"
            />
          );
        },
      },
      {
        headerName: 'Drivers',
        field: 'drivers',
        minWidth: 110,
        maxWidth: 130,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Vehicles',
        field: 'vehicles',
        minWidth: 110,
        maxWidth: 130,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Revenue',
        field: 'revenue',
        minWidth: 160,
        valueFormatter: ({ value }: { value: number }) => currencyFormatter.format(value),
        cellStyle: { textAlign: 'right' },
      },
      {
        headerName: 'Active Loads',
        field: 'activeLoads',
        minWidth: 140,
        maxWidth: 160,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: '',
        colId: 'actions',
        minWidth: 120,
        maxWidth: 140,
        sortable: false,
        cellStyle: { textAlign: 'right' },
        cellRenderer: () => (
          <Button size="small" variant="outlined">
            View
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <PageWrapper errorContext="FleetCarriersPage" sx={{ gap: 2 }}>
      <PageHeader
        title="Carriers"
        headerActions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button variant="contained">Add Carrier</Button>
          </Stack>
        }
      />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {kpiData.map((kpiItem) => (
          <Grid key={kpiItem.label} item xs={12} md={6} xl={3}>
            <MainCard sx={{ height: '100%' }}>
              <Typography variant="caption" color="text.secondary">
                {kpiItem.label}
              </Typography>
              <Typography variant="h4" color="text.primary" sx={{ mt: 0.5 }}>
                {kpiItem.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {kpiItem.subtitle}
              </Typography>
            </MainCard>
          </Grid>
        ))}
      </Grid>

      <MainCard
        content={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tabs
            value={activeTab}
            onChange={(_event, value: CarrierTab) => setActiveTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ minHeight: 40 }}
          >
            {tabOptions.map((tabOption) => (
              <Tab
                key={tabOption.key}
                value={tabOption.key}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2">{tabOption.label}</Typography>
                    <Chip label={tabOption.count} size="small" />
                  </Stack>
                }
                sx={{ minHeight: 40 }}
              />
            ))}
          </Tabs>

          <TextField
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search carriers, contacts, MC#..."
            size="small"
            sx={{ width: { xs: '100%', lg: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="body2" color="text.secondary">
                    ⌕
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Box
            sx={{
              height: {
                xs: 'clamp(300px, 48vh, 420px)',
                md: 'clamp(420px, calc(100vh - 430px), 760px)',
              },
              minHeight: { xs: 300, md: 420 },
              flex: 1,
            }}
          >
            <NewDataGrid
              columnDefs={columnDefs}
              rowData={filteredCarriers}
              defaultColDef={defaultColDef}
              showRowCountFooter
              totalRowCount={carriers.length}
              rowCountLabel="carriers"
              noDataMessage="No carriers found"
              noDataComponent={
                <EmptyState
                  variant="no-results"
                  entityName="Carriers"
                  compact
                  onAction={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                />
              }
              gridOptions={{
                domLayout: 'normal',
                pagination: false,
                suppressCellFocus: true,
                headerHeight: 44,
                rowHeight: 62,
              }}
            />
          </Box>
        </Box>
      </MainCard>
    </PageWrapper>
  );
};

export default Fleet;
