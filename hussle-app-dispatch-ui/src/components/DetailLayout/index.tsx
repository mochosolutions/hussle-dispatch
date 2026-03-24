import type { ReactNode } from 'react';
import { Box, Button, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { EntityId } from 'components/Typography';
import { StatusBadge } from 'components/Statusbadge';
import type { StatusKey } from 'components/Statusbadge';
import { SummaryBar } from 'components/SummaryBar';
import { DetailTabBar } from 'components/DetailTabBar';

interface Breadcrumb {
  label: string;
  href: string;
}

interface TabDefinition {
  label: string;
  value: string;
}

interface DetailLayoutProps {
  id: string;
  status?: StatusKey | string;
  breadcrumb: Breadcrumb;
  /** Client-side back handler (e.g. React Router navigate). When provided, used instead of breadcrumb.href. */
  onBack?: () => void;
  actions?: ReactNode;
  summary?: ReactNode;
  tabs?: readonly TabDefinition[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: ReactNode;
  /** When true, the header, summary bar, and tabs stick to the top while content scrolls. Defaults to true. */
  stickyHeader?: boolean;
  sx?: SxProps<Theme>;
}

export const DetailLayout: React.FC<DetailLayoutProps> = ({
  id,
  status,
  breadcrumb,
  onBack,
  actions,
  summary,
  tabs,
  activeTab,
  onTabChange,
  children,
  stickyHeader = true,
  sx,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>
    {/* Sticky header group */}
    <Box
      sx={{
        ...(stickyHeader && {
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }),
        flexShrink: 0,
      }}
    >
      {/* Navy header zone */}
      <Box
        sx={{
          bgcolor: 'primary.dark',
          color: 'primary.contrastText',
          px: { xs: 2, sm: 3 },
          py: 1.5,
        }}
      >
        <Button
          {...(onBack
            ? { onClick: onBack }
            : { component: 'a' as const, href: breadcrumb.href })}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{
            justifyContent: 'flex-start',
            color: 'grey.300',
            textDecoration: 'none',
            mb: 0.5,
            p: 0,
            minWidth: 0,
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'grey.100',
            },
          }}
        >
          {breadcrumb.label}
        </Button>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <EntityId sx={{ color: 'common.white' }}>{id}</EntityId>
            {status && <StatusBadge status={status} />}
          </Stack>
          {actions && (
            <Stack direction="row" spacing={1}>
              {actions}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Summary bar */}
      {summary && <SummaryBar>{summary}</SummaryBar>}

      {/* Tab bar */}
      {tabs && activeTab !== undefined && onTabChange && (
        <DetailTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </Box>

    {/* Scrollable body */}
    <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'grey.100', p: { xs: 2, sm: 3 } }}>
      {children}
    </Box>
  </Box>
);
