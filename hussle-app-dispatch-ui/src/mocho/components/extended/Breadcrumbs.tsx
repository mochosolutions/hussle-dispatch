import {CSSProperties, ReactElement, ComponentType} from 'react';

// material-ui
import {useTheme} from '@mui/material/styles';
import {Divider, Grid, Typography, Box} from '@mui/material';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';

// project import
import MainCard from '../../components/MainCard';

// assets
import {HomeOutlined, HomeFilled} from '@ant-design/icons';

// types
import {OverrideIcon} from '../../types/root';

// ==============================|| BREADCRUMBS - TYPES ||============================== //

export interface BreadCrumbSxProps extends CSSProperties {
  mb?: string;
  bgcolor?: string;
}

export interface BreadcrumbItem {
  /** Display title */
  title: string;

  /** URL/path (optional) */
  url?: string;

  /** Icon component (optional) */
  icon?: OverrideIcon;

  /** Whether this is the active/current item */
  active?: boolean;
}

interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];

  /** Show breadcrumbs in a card */
  card?: boolean;

  /** Show divider after breadcrumbs */
  divider?: boolean;

  /** Show icon for home item only */
  icon?: boolean;

  /** Show icons for all items */
  icons?: boolean;

  /** Maximum number of breadcrumbs to show */
  maxItems?: number;

  /** Align breadcrumbs to the right */
  rightAlign?: boolean;

  /** Custom separator icon/element */
  separator?: OverrideIcon;

  /** Show page title */
  title?: boolean;

  /** Show title below breadcrumbs */
  titleBottom?: boolean;

  /** Custom styles */
  sx?: BreadCrumbSxProps;

  /** Custom Link component (e.g., from react-router, next/link) or HTML element type */
  LinkComponent?: ComponentType<any> | keyof JSX.IntrinsicElements;

  /** Home URL (default: '/') */
  homeUrl?: string;
}

// ==============================|| BREADCRUMBS ||============================== //

const Breadcrumbs = ({
  items = [],
  card = true,
  divider = true,
  icon = false,
  icons = false,
  maxItems = 8,
  rightAlign = false,
  separator,
  title = false,
  titleBottom = false,
  sx,
  LinkComponent = 'a',
  homeUrl = '/',
  ...others
}: BreadcrumbsProps) => {
  const theme = useTheme();

  const iconSX = {
    marginRight: theme.spacing(0.75),
    marginTop: `-${theme.spacing(0.25)}`,
    width: '1rem',
    height: '1rem',
    color: theme.palette.secondary.main,
  };

  // item separator
  const SeparatorIcon = separator!;
  const separatorIcon = separator ? (
    <SeparatorIcon style={{fontSize: '0.75rem', marginTop: 2}} />
  ) : (
    '/'
  );

  // Get active item (last item or item marked as active)
  const activeItem = items.find(item => item.active) || items[items.length - 1];
  const pageTitle = activeItem?.title || '';

  // Render home breadcrumb
  const homeContent = (
    <Typography
      component={LinkComponent}
      href={homeUrl}
      to={homeUrl}
      color="textSecondary"
      variant="h6"
      sx={{textDecoration: 'none', cursor: 'pointer'}}
    >
      {icons && <HomeOutlined style={iconSX} />}
      {icon && !icons && <HomeFilled style={{...iconSX, marginRight: 0}} />}
      {(!icon || icons) && 'Home'}
    </Typography>
  );

  // Render breadcrumb items
  const breadcrumbItems = items.map((item, index) => {
    const isActive = item.active !== undefined ? item.active : index === items.length - 1;
    const ItemIcon = item.icon;

    if (isActive) {
      return (
        <Typography key={index} variant="subtitle1" color="textPrimary">
          {icons && ItemIcon && <ItemIcon style={iconSX} />}
          {item.title}
        </Typography>
      );
    }

    return (
      <Typography
        key={index}
        component={item.url ? LinkComponent : 'span'}
        href={item.url}
        to={item.url}
        variant="h6"
        sx={{textDecoration: 'none', cursor: item.url ? 'pointer' : 'default'}}
        color="textSecondary"
      >
        {icons && ItemIcon && <ItemIcon style={iconSX} />}
        {item.title}
      </Typography>
    );
  });

  return (
    <MainCard
      border={card}
      sx={card === false ? {mb: 3, bgcolor: 'transparent', ...sx} : {mb: 3, ...sx}}
      {...others}
      content={card}
      shadow="none"
    >
      <Grid
        container
        direction={rightAlign ? 'row' : 'column'}
        justifyContent={rightAlign ? 'space-between' : 'flex-start'}
        alignItems={rightAlign ? 'center' : 'flex-start'}
        spacing={1}
      >
        {title && !titleBottom && (
          <Grid item>
            <Typography variant="h2">{pageTitle}</Typography>
          </Grid>
        )}

        <Grid item>
          <MuiBreadcrumbs
            aria-label="breadcrumb"
            maxItems={maxItems}
            separator={separatorIcon}
          >
            {homeContent}
            {breadcrumbItems}
          </MuiBreadcrumbs>
        </Grid>

        {title && titleBottom && (
          <Grid item sx={{mt: card === false ? 0.25 : 1}}>
            <Typography variant="h2">{pageTitle}</Typography>
          </Grid>
        )}
      </Grid>

      {card === false && divider !== false && <Divider sx={{mt: 2}} />}
    </MainCard>
  );
};

export default Breadcrumbs;
