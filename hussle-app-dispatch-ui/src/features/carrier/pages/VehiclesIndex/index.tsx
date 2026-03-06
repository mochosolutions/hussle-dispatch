import { useState } from 'react';
import { Box, Button, Chip, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import EditOutlined from '@ant-design/icons/EditOutlined';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import { PageWrapper } from '@mocho/ui/components';

const vehicleTabs = [
  { key: 'all', label: 'All Vehicles' },
  { key: 'owned', label: 'Owned', count: 14 },
  { key: 'leased', label: 'Leased', count: 7 },
  { key: 'maintenance', label: 'Maintenance', count: 2 },
];

const VehiclesIndex = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <PageWrapper
      errorContext="FleetVehiclesPage"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 'calc(100vh - 110px)',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          px: { xs: 2, sm: 3 },
          py: 1.75,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={1.5}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                ← Vehicles
              </Typography>
              <Typography variant="h4" color="text.primary">
                #133718
              </Typography>
              <Chip label="Hustle Transport" size="small" color="primary" variant="outlined" />
              <Chip label="Company Asset" size="small" color="secondary" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              2022 Freightliner Cascadia · VIN: 3AKJGLDR8NSLA4927
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="secondary" startIcon={<EditOutlined />}>
              Edit
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              sx={{ minWidth: 40, px: 1.5 }}
            >
              <MoreOutlined />
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          px: { xs: 2, sm: 3 },
          py: 1.25,
        }}
      >
        <Grid container sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {[
            { label: 'Type', value: '2022 Freightliner Cascadia' },
            { label: 'Equipment', value: 'Dry Van' },
            { label: 'Ownership', value: 'Owned' },
            { label: 'Driver', value: 'Marcus Johnson' },
            { label: 'CPM', value: '$0.85/mi' },
            { label: 'Monthly Cost', value: '$8,500' },
          ].map((item, index) => (
            <Grid
              key={item.label}
              item
              xs={12}
              md={2}
              sx={{
                px: 1.75,
                py: 1,
                borderRight: { md: index < 5 ? 1 : 0 },
                borderBottom: { xs: 1, md: 0 },
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', fontWeight: 600 }}
              >
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                {item.value}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          px: { xs: 2, sm: 3 },
          pt: 0.25,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_event, value: string) => setActiveTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ minHeight: 44 }}
        >
          {vehicleTabs.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              label={
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="body2">{tab.label}</Typography>
                  {'count' in tab && tab.count !== undefined && (
                    <Chip label={tab.count} size="small" variant="outlined" sx={{ height: 18 }} />
                  )}
                </Stack>
              }
              sx={{ minHeight: 44 }}
            />
          ))}
        </Tabs>
      </Box>

      <Box
        sx={{
          flex: 1,
          backgroundColor: 'background.default',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            // backgroundColor: 'background.paper',
            p: 2.5,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Vehicle list content goes here.
          </Typography>
        </Box>
      </Box>
    </PageWrapper>
  );
};

export default VehiclesIndex;
