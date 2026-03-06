import type { Meta, StoryObj } from '@storybook/react';
import { Box, Grid } from '@mui/material';
import AnalyticEcommerce from './AnalyticEcommerce';
import AnalyticsDataCard from './AnalyticsDataCard';

/**
 * Statistics cards for displaying key metrics with trend indicators.
 *
 * AnalyticEcommerce: Standalone card with title, count, percentage change, and extra info.
 * AnalyticsDataCard: Card that accepts children for custom content (like charts).
 */
const meta: Meta = {
  title: 'Components/Complex/Cards/Statistics',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

// ==================== AnalyticEcommerce Stories ====================

export const BasicAnalyticCard: StoryObj<typeof AnalyticEcommerce> = {
  name: 'Analytic Ecommerce - Basic',
  render: () => (
    <Box sx={{ maxWidth: 300 }}>
      <AnalyticEcommerce
        title="Total Page Views"
        count="4,42,236"
        percentage={59.3}
        extra="35,000"
      />
    </Box>
  ),
};

export const AnalyticCardLoss: StoryObj<typeof AnalyticEcommerce> = {
  name: 'Analytic Ecommerce - Loss',
  render: () => (
    <Box sx={{ maxWidth: 300 }}>
      <AnalyticEcommerce
        title="Total Revenue"
        count="$78,250"
        percentage={27.4}
        isLoss={true}
        color="error"
        extra="$20,395"
      />
    </Box>
  ),
};

export const AnalyticCardSuccess: StoryObj<typeof AnalyticEcommerce> = {
  name: 'Analytic Ecommerce - Success',
  render: () => (
    <Box sx={{ maxWidth: 300 }}>
      <AnalyticEcommerce
        title="New Orders"
        count="1,520"
        percentage={45.2}
        color="success"
        extra="320"
      />
    </Box>
  ),
};

export const AnalyticCardGrid: StoryObj = {
  name: 'Analytic Ecommerce - Dashboard Grid',
  render: () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Total Page Views"
          count="4,42,236"
          percentage={59.3}
          extra="35,000"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Total Users"
          count="78,250"
          percentage={70.5}
          color="success"
          extra="8,900"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Total Order"
          count="18,800"
          percentage={27.4}
          isLoss={true}
          color="warning"
          extra="1,943"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Total Sales"
          count="$35,078"
          percentage={27.4}
          isLoss={true}
          color="error"
          extra="$20,395"
        />
      </Grid>
    </Grid>
  ),
};

// ==================== AnalyticsDataCard Stories ====================

export const DataCardBasic: StoryObj<typeof AnalyticsDataCard> = {
  name: 'Analytics Data Card - Basic',
  render: () => (
    <Box sx={{ maxWidth: 400 }}>
      <AnalyticsDataCard
        title="Total Revenue"
        count="$2,35,132"
        percentage={8.2}
        color="success"
      >
        <Box sx={{ height: 100, bgcolor: 'action.hover', m: 2, borderRadius: 1 }}>
          Chart placeholder
        </Box>
      </AnalyticsDataCard>
    </Box>
  ),
};

export const DataCardWithChart: StoryObj<typeof AnalyticsDataCard> = {
  name: 'Analytics Data Card - With Chart Area',
  render: () => (
    <Box sx={{ maxWidth: 500 }}>
      <AnalyticsDataCard
        title="Monthly Sales"
        count="$8,54,210"
        percentage={12.5}
        color="primary"
      >
        <Box
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          {/* Simulated bar chart */}
          {[60, 80, 45, 90, 70, 85, 95].map((height, i) => (
            <Box
              key={i}
              sx={{
                width: 30,
                height: `${height}%`,
                bgcolor: 'primary.main',
                borderRadius: '4px 4px 0 0',
                opacity: 0.7 + i * 0.05,
              }}
            />
          ))}
        </Box>
      </AnalyticsDataCard>
    </Box>
  ),
};

export const DataCardLoss: StoryObj<typeof AnalyticsDataCard> = {
  name: 'Analytics Data Card - Loss',
  render: () => (
    <Box sx={{ maxWidth: 400 }}>
      <AnalyticsDataCard
        title="Bounce Rate"
        count="45.32%"
        percentage={5.8}
        isLoss={true}
        color="error"
      >
        <Box
          sx={{
            height: 60,
            bgcolor: 'error.lighter',
            m: 2,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Trend indicator area
        </Box>
      </AnalyticsDataCard>
    </Box>
  ),
};

export const DataCardGrid: StoryObj = {
  name: 'Analytics Data Cards - Dashboard',
  render: () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <AnalyticsDataCard
          title="Total Revenue"
          count="$2,35,132"
          percentage={8.2}
          color="success"
        >
          <Box
            sx={{
              height: 150,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              p: 2,
            }}
          >
            {[40, 60, 50, 70, 65, 80, 75].map((h, i) => (
              <Box
                key={i}
                sx={{
                  width: 20,
                  height: `${h}%`,
                  bgcolor: 'success.main',
                  borderRadius: 1,
                  opacity: 0.6 + i * 0.05,
                }}
              />
            ))}
          </Box>
        </AnalyticsDataCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <AnalyticsDataCard
          title="Active Users"
          count="12,543"
          percentage={15.3}
          color="primary"
        >
          <Box
            sx={{
              height: 150,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              p: 2,
            }}
          >
            {[50, 45, 60, 55, 70, 85, 90].map((h, i) => (
              <Box
                key={i}
                sx={{
                  width: 20,
                  height: `${h}%`,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                  opacity: 0.6 + i * 0.05,
                }}
              />
            ))}
          </Box>
        </AnalyticsDataCard>
      </Grid>
    </Grid>
  ),
};
