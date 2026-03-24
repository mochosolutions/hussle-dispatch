import { Box, Tab, Tabs } from '@mui/material';

interface TabDefinition {
  readonly value: string;
  readonly label: string;
}

interface DetailTabBarProps {
  tabs: readonly TabDefinition[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DetailTabBar: React.FC<DetailTabBarProps> = ({ tabs, activeTab, onTabChange }) => (
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
      onChange={(_event, value: string) => onTabChange(value)}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{
        minHeight: 44,
        '& .MuiTabs-indicator': {
          backgroundColor: 'primary.main',
          height: 3,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          value={tab.value}
          sx={{
            minHeight: 44,
            fontSize: 13,
            fontWeight: 500,
            color: 'grey.600',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          }}
          label={tab.label}
        />
      ))}
    </Tabs>
  </Box>
);
