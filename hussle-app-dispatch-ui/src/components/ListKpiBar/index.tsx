import { Grid, Skeleton } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import MainCard from 'mocho/components/MainCard';
import { KpiCell } from 'components/Typography';

export interface KpiItem {
  label: string;
  value: string | number;
  subtitle?: string;
}

export interface ListKpiBarProps {
  items: KpiItem[];
  /**
   * When true, KPI values render as skeletons. Use this on initial list-page
   * load (before `hasLoadedOnce` is true) so tiles do not flash `0` while
   * data is still in flight.
   */
  loading?: boolean;
  sx?: SxProps<Theme>;
}

const isCurrencyValue = (value: string | number): boolean =>
  typeof value === 'string' && value.startsWith('$');

const ListKpiBar: React.FC<ListKpiBarProps> = ({ items, loading = false, sx }) => (
  <Grid container spacing={2} sx={{ mb: 2, ...sx }}>
    {items.map((item) => (
      <Grid key={item.label} item xs={12} sm={6} md>
        <MainCard sx={{ height: '100%' }}>
          <KpiCell
            label={item.label}
            value={loading ? <Skeleton variant="text" width={48} height={32} /> : item.value}
            sub={loading ? <Skeleton variant="text" width={80} height={20} /> : item.subtitle}
            valueProps={
              !loading && isCurrencyValue(item.value)
                ? { fontVariantNumeric: 'tabular-nums' }
                : undefined
            }
          />
        </MainCard>
      </Grid>
    ))}
  </Grid>
);

export default ListKpiBar;
