import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditOutlined from '@ant-design/icons/EditOutlined';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import { EmptyState, MainCard, PageWrapper } from '@mocho/ui/components';
import { useNavigate, useParams } from 'react-router-dom';

type VehicleTab = 'overview' | 'loadHistory' | 'documents';
type ExpenseCategory = 'fixed' | 'variable' | 'service';

interface ExpenseItem {
  key: string;
  label: string;
  amount: number;
  tooltip: string;
}

interface WeeklyGross {
  week: string;
  amount: number;
}

const defaultExpenses: Record<ExpenseCategory, ExpenseItem[]> = {
  fixed: [
    {
      key: 'truck_payment',
      label: 'Truck Payment',
      amount: 1800,
      tooltip: 'Monthly loan or lease payment',
    },
    {
      key: 'insurance',
      label: 'Insurance',
      amount: 1200,
      tooltip: 'Liability + cargo + physical damage',
    },
    {
      key: 'permits',
      label: 'Permits & Licenses',
      amount: 250,
      tooltip: 'IFTA, IRP, UCR, NMFTA',
    },
    {
      key: 'parking',
      label: 'Parking',
      amount: 200,
      tooltip: 'Yard parking or overnight',
    },
  ],
  variable: [
    {
      key: 'fuel',
      label: 'Fuel (estimated)',
      amount: 2400,
      tooltip: '~6.5 MPG × $3.70/gal × 10K mi',
    },
    {
      key: 'tires',
      label: 'Tires',
      amount: 300,
      tooltip: 'Replacement + rotation reserve',
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      amount: 500,
      tooltip: 'Preventive + reserve for repairs',
    },
    {
      key: 'tolls',
      label: 'Tolls',
      amount: 350,
      tooltip: 'I-95 corridor, NJ Turnpike average',
    },
  ],
  service: [
    {
      key: 'driver_pay',
      label: 'Driver Pay',
      amount: 1200,
      tooltip: 'Base weekly pay equivalent',
    },
    {
      key: 'benefits',
      label: 'Benefits',
      amount: 300,
      tooltip: 'Health + workers comp reserve',
    },
  ],
};

const weeklyGrossData: WeeklyGross[] = [
  { week: 'Jan 20', amount: 4200 },
  { week: 'Jan 27', amount: 5100 },
  { week: 'Feb 3', amount: 3800 },
  { week: 'Feb 10', amount: 5400 },
  { week: 'Feb 17', amount: 4700 },
  { week: 'Feb 24', amount: 3900 },
];

const parseNumber = (value: string): number => {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const VehicleDetailPage = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const [activeTab, setActiveTab] = useState<VehicleTab>('overview');
  const [targetMiles, setTargetMiles] = useState(10000);
  const [workingDays, setWorkingDays] = useState(22);
  const [isSaved, setIsSaved] = useState(false);

  const [expenses, setExpenses] = useState<Record<string, number>>(() => {
    const records: Record<string, number> = {};

    Object.values(defaultExpenses)
      .flat()
      .forEach((item) => {
        records[item.key] = item.amount;
      });

    return records;
  });

  const totals = useMemo(() => {
    const totalFixed = defaultExpenses.fixed.reduce(
      (sum, item) => sum + (expenses[item.key] ?? 0),
      0,
    );
    const totalVariable = defaultExpenses.variable.reduce(
      (sum, item) => sum + (expenses[item.key] ?? 0),
      0,
    );
    const totalService = defaultExpenses.service.reduce(
      (sum, item) => sum + (expenses[item.key] ?? 0),
      0,
    );
    const monthlyTotal = totalFixed + totalVariable + totalService;
    const cpm = targetMiles > 0 ? monthlyTotal / targetMiles : 0;
    const dailyMin = workingDays > 0 ? monthlyTotal / workingDays : 0;
    const weeklyMin = dailyMin * (workingDays > 0 ? Math.min(workingDays / 4.33, 7) : 5);
    const minBookRate = Math.round(cpm * 1000 * 1.15);

    return {
      totalFixed,
      totalVariable,
      totalService,
      monthlyTotal,
      cpm,
      dailyMin,
      weeklyMin,
      minBookRate,
    };
  }, [expenses, targetMiles, workingDays]);

  const revenueAverage = Math.round(
    weeklyGrossData.reduce((sum, item) => sum + item.amount, 0) / weeklyGrossData.length,
  );

  const tabItems: { key: string; label: string; count?: number }[] = [
    { key: 'info', label: 'Info' },
    { key: 'overview', label: 'Expenses' },
    { key: 'loadHistory', label: 'Load History', count: 42 },
    { key: 'documents', label: 'Documents', count: 3 },
  ];

  const handleExpenseChange = (key: string, value: number) => {
    setExpenses((previous) => ({
      ...previous,
      [key]: value,
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const maxWeeklyValue = Math.max(...weeklyGrossData.map((item) => item.amount), 5000) * 1.15;

  return (
    <PageWrapper
      errorContext="FleetVehicleDetailPage"
      sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 'calc(100vh - 110px)' }}
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
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap' }}
            >
              <Button
                variant="text"
                color="inherit"
                onClick={() => navigate('/fleet/vehicles')}
                sx={{ minWidth: 0, px: 0, color: 'text.secondary' }}
              >
                ← Vehicles
              </Button>
              <Typography variant="h4" color="text.primary">
                {vehicleId ?? '#133718'}
              </Typography>
              <Chip label="Hustle Transport" size="small" color="primary" variant="outlined" />
              <Chip label="Company Asset" size="small" color="secondary" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              2022 Freightliner Cascadia · VIN: 3AKJGLDR8NSLA4927
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
            }}
          >
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
            { label: 'Ownership', value: 'Owned', owned: true },
            { label: 'Driver', value: 'Marcus Johnson', link: true },
            { label: 'CPM', value: `$${totals.cpm.toFixed(2)}/mi`, bold: true },
            {
              label: 'Monthly Cost',
              value: currencyCompact.format(totals.monthlyTotal),
              bold: true,
            },
          ].map((item, index) => (
            <Grid
              item
              xs={12}
              md={2}
              key={item.label}
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
                sx={{ textTransform: 'uppercase' }}
              >
                {item.label}
              </Typography>
              {'owned' in item && item.owned ? (
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {item.value}
                  </Typography>
                </Stack>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    color: item.link ? 'primary.main' : 'text.primary',
                    fontWeight: item.bold ? 700 : 500,
                  }}
                >
                  {item.value}
                </Typography>
              )}
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
          onChange={(_event, value: VehicleTab) => setActiveTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ minHeight: 44 }}
        >
          {tabItems.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              sx={{ minHeight: 44 }}
              label={
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="body2">{tab.label}</Typography>
                  {tab.count !== undefined && (
                    <Chip label={tab.count} size="small" variant="outlined" sx={{ height: 18 }} />
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, backgroundColor: 'background.default', px: { xs: 2, sm: 3 }, py: 2 }}>
        {activeTab !== 'overview' ? (
          <MainCard>
            <EmptyState
              title={
                activeTab === 'loadHistory' ? 'Load history coming soon' : 'Documents coming soon'
              }
              message="This section will be wired to API data in the next iteration."
            />
          </MainCard>
        ) : (
          <Grid container spacing={{ xs: 2, lg: 2.5 }} alignItems="flex-start">
            <Grid item xs={12} lg={9}>
              <MainCard sx={{ height: '100%' }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  sx={{ mb: 2 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h5">CPM Expense Editor</Typography>
                    <Chip label="KEY FEATURE" color="primary" size="small" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Drives min book rates
                  </Typography>
                </Stack>

                {(
                  [
                    {
                      key: 'fixed' as const,
                      label: 'Fixed Costs (monthly)',
                      total: totals.totalFixed,
                    },
                    {
                      key: 'variable' as const,
                      label: 'Variable Costs (monthly)',
                      total: totals.totalVariable,
                    },
                    {
                      key: 'service' as const,
                      label: 'Service / Wage',
                      total: totals.totalService,
                    },
                  ] as const
                ).map((section) => (
                  <Box
                    key={section.key}
                    sx={{ mb: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase' }}
                      >
                        {section.label}
                      </Typography>
                      <Typography variant="subtitle2">
                        {currencyCompact.format(section.total)}
                      </Typography>
                    </Stack>

                    <Stack>
                      {defaultExpenses[section.key].map((item) => (
                        <Stack
                          key={item.key}
                          direction={{ xs: 'column', sm: 'row' }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          justifyContent="space-between"
                          spacing={1}
                          sx={{
                            px: 1.5,
                            py: 1,
                            borderBottom: 1,
                            borderColor: 'divider',
                            '&:last-of-type': { borderBottom: 0 },
                          }}
                        >
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2">{item.label}</Typography>
                            <Tooltip title={item.tooltip}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ cursor: 'help' }}
                              >
                                Info
                              </Typography>
                            </Tooltip>
                          </Stack>
                          <TextField
                            size="small"
                            value={(expenses[item.key] ?? 0).toLocaleString()}
                            onChange={(event) => {
                              handleExpenseChange(item.key, parseNumber(event.target.value));
                            }}
                            sx={{ width: { xs: '100%', sm: 140 } }}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                              inputProps: {
                                style: {
                                  textAlign: 'right',
                                  fontWeight: 600,
                                },
                              },
                            }}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ))}

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 2, mt: 1, pt: 1, borderTop: 2, borderColor: 'divider' }}
                >
                  <Typography variant="h5">Monthly Total</Typography>
                  <Typography variant="h4">
                    {currencyCompact.format(totals.monthlyTotal)}
                  </Typography>
                </Stack>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Target Miles / Month"
                      size="small"
                      fullWidth
                      value={targetMiles.toLocaleString()}
                      onChange={(event) => {
                        setTargetMiles(parseNumber(event.target.value));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Working Days / Month"
                      size="small"
                      fullWidth
                      value={String(workingDays)}
                      onChange={(event) => {
                        setWorkingDays(parseNumber(event.target.value));
                      }}
                    />
                  </Grid>
                </Grid>

                <MainCard sx={{ bgcolor: 'primary.lighter', borderColor: 'primary.light', mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{ textTransform: 'uppercase', color: 'primary.main' }}
                  >
                    Calculated — Auto-computed
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        Cost Per Mile
                      </Typography>
                      <Typography variant="h4">${totals.cpm.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        Daily Min Revenue
                      </Typography>
                      <Typography variant="h4">${totals.dailyMin.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        Weekly Min Revenue
                      </Typography>
                      <Typography variant="h4">${totals.weeklyMin.toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                </MainCard>

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    startIcon={isSaved ? undefined : <SaveOutlined />}
                    color={isSaved ? 'success' : 'primary'}
                    onClick={handleSave}
                  >
                    {isSaved ? 'Saved' : 'Save Expenses'}
                  </Button>
                </Stack>
              </MainCard>
            </Grid>

            <Grid item xs={12} lg={3}>
              <Stack spacing={2}>
                <MainCard>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography variant="h5">Revenue Performance</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last 6 weeks
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-end"
                    sx={{ height: 118, borderBottom: 1, borderColor: 'divider', pb: 1 }}
                  >
                    {weeklyGrossData.map((item) => {
                      const height = (item.amount / maxWeeklyValue) * 100;
                      const isAboveTarget = item.amount >= 5000;

                      return (
                        <Box key={item.week} sx={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              textAlign: 'center',
                              color: isAboveTarget ? 'success.main' : 'warning.main',
                              mb: 0.5,
                            }}
                          >
                            ${(item.amount / 1000).toFixed(1)}K
                          </Typography>
                          <Box
                            sx={{
                              borderRadius: 1,
                              width: '100%',
                              height: `${Math.max(height, 4)}%`,
                              bgcolor: isAboveTarget ? 'success.main' : 'warning.main',
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {item.week}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>

                  <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1, bgcolor: 'grey.100' }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        6-week avg:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {currencyCompact.format(revenueAverage)}
                      </Typography>
                    </Stack>
                  </Box>
                </MainCard>

                <MainCard>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Current Assignment
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>MJ</Avatar>
                    <Box>
                      <Typography variant="subtitle1">Marcus Johnson</Typography>
                      <Typography variant="caption" color="text.secondary">
                        CDL-A #133718
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={1.25}>
                    {[
                      { label: 'Status', value: 'Available', color: 'success.main' },
                      { label: 'Location', value: 'Newark, NJ (home base)' },
                      { label: 'Hours Available', value: '62h of 70' },
                      { label: 'Days Out', value: '0 (home now)' },
                      { label: 'Last Delivered', value: 'Feb 26, 4:30 PM' },
                    ].map((row) => (
                      <Stack
                        key={row.label}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {row.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: row.color ?? 'text.primary', fontWeight: 600 }}
                        >
                          {row.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SearchOutlined />}
                    sx={{ mt: 1.5 }}
                  >
                    Find Matching Loads
                  </Button>
                </MainCard>

                <MainCard sx={{ bgcolor: 'primary.lighter', borderColor: 'primary.light' }}>
                  <Typography variant="h5">Min Book Rate</Typography>
                  <Typography variant="h2" sx={{ mt: 1 }}>
                    {currencyCompact.format(totals.minBookRate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    ${totals.cpm.toFixed(2)} CPM + 15% margin
                  </Typography>
                  <Alert severity="info" sx={{ mt: 1.5 }}>
                    Used in Load Intelligence scoring to filter out unprofitable loads.
                  </Alert>
                </MainCard>
              </Stack>
            </Grid>
          </Grid>
        )}
      </Box>
    </PageWrapper>
  );
};

export default VehicleDetailPage;
