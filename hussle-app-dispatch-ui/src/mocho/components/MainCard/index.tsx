import { forwardRef, CSSProperties, ReactNode, Ref } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  CardProps,
  CardHeaderProps,
  CardContentProps,
} from '@mui/material';

// header style
const defaultHeaderSX = {
  p: 2.5,
  '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' },
};

export interface MainCardProps {
  border?: boolean;
  boxShadow?: boolean;
  children?: ReactNode | string;
  subheader?: ReactNode | string;
  style?: CSSProperties;
  content?: boolean;
  contentSX?: CardContentProps['sx'];
  darkTitle?: boolean;
  divider?: boolean;
  sx?: CardProps['sx'];
  secondary?: CardHeaderProps['action'];
  shadow?: string;
  elevation?: number;
  title?: ReactNode | string;
  modal?: boolean;
  [key: string]: unknown;
  headerSX?: CardHeaderProps['sx'];
}

/**
 * MainCard - A styled card wrapper component
 *
 * Provides consistent styling for card-based content areas in admin dashboards.
 * Supports title, subtitle, actions, and various styling options.
 *
 * @example
 * ```tsx
 * <MainCard title="Blog Posts" elevation={0} border>
 *   <DataGrid {...props} />
 * </MainCard>
 *
 * <MainCard
 *   title="Edit Post"
 *   secondary={<Button>Save</Button>}
 * >
 *   <BlogPostForm />
 * </MainCard>
 * ```
 */
const MainCard = forwardRef(
  (
    {
      border = true,
      boxShadow,
      children,
      subheader,
      content = true,
      contentSX = {},
      darkTitle,
      divider = true,
      elevation,
      secondary,
      shadow,
      sx = {},
      title,
      modal = false,
      headerSX = {},
      ...others
    }: MainCardProps,
    ref: Ref<HTMLDivElement>,
  ) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // Default boxShadow to true in dark mode
    const computedBoxShadow = isDarkMode ? (boxShadow ?? true) : boxShadow;

    // Get custom shadow or fallback
    const customShadow = shadow || (theme.customShadows?.z1 ?? theme.shadows[1]);

    return (
      <Card
        elevation={elevation ?? 0}
        ref={ref}
        {...others}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 1,
          marginBottom: 1,
          position: 'relative',
          border: border ? '1px solid' : 'none',
          borderRadius: 1,
          borderColor: isDarkMode ? theme.palette.divider : theme.palette.grey[300],
          boxShadow: computedBoxShadow && (!border || isDarkMode) ? customShadow : 'inherit',
          ':hover': {
            boxShadow: computedBoxShadow ? customShadow : 'inherit',
          },
          ...(modal && {
            position: 'absolute' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: `calc( 100% - 50px)`, sm: 'auto' },
            '& .MuiCardContent-root': {
              overflowY: 'auto',
              minHeight: 'auto',
              maxHeight: `calc(100vh - 200px)`,
            },
          }),
          ...sx,
        }}
      >
        {/* card header and action */}
        {!darkTitle && title && (
          <CardHeader
            sx={{
              ...defaultHeaderSX,
              ...headerSX,
            }}
            titleTypographyProps={{ variant: 'subtitle1' }}
            title={title}
            action={secondary}
            subheader={subheader}
          />
        )}
        {darkTitle && title && (
          <CardHeader
            sx={{
              ...defaultHeaderSX,
              ...headerSX,
            }}
            title={<Typography variant="h4">{title}</Typography>}
            action={secondary}
          />
        )}

        {/* content & header divider */}
        {title && divider && <Divider />}

        {/* card content */}
        {content && <CardContent sx={contentSX}>{children}</CardContent>}
        {!content && children}
      </Card>
    );
  },
);

MainCard.displayName = 'MainCard';

export default MainCard;
