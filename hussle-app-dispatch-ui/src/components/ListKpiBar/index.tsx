import { Grid } from '@mui/material';
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
  sx?: SxProps<Theme>;
}

const isCurrencyValue = (value: string | number): boolean =>
  typeof value === 'string' && value.startsWith('$');

const ListKpiBar: React.FC<ListKpiBarProps> = ({ items, sx }) => (
  <Grid container spacing={2} sx={{ mb: 2, ...sx }}>
    {items.map((item) => (
      <Grid key={item.label} item xs={12} sm={6} md>
        <MainCard sx={{ height: '100%' }}>
          <KpiCell
            label={item.label}
            value={item.value}
            sub={item.subtitle}
            valueProps={
              isCurrencyValue(item.value)
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
