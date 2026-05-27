import type { ReactNode, ReactElement } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { Children, isValidElement, Fragment } from 'react';

interface SummaryBarProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

const flattenChildren = (children: ReactNode): ReactNode[] => {
  const result: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Fragment) {
      result.push(...flattenChildren((child as ReactElement<{ children?: ReactNode }>).props.children));
    } else if (child !== null && child !== undefined && child !== false) {
      result.push(child);
    }
  });
  return result;
};

export const SummaryBar: React.FC<SummaryBarProps> = ({ children, sx }) => {
  const childArray = flattenChildren(children);
  const items: React.ReactNode[] = [];

  childArray.forEach((child, index) => {
    if (index > 0) {
      items.push(
        <Box
          key={`divider-${index}`}
          sx={{
            width: '1px',
            alignSelf: 'stretch',
            bgcolor: 'grey.200',
            mx: 2.5,
            flexShrink: 0,
          }}
        />,
      );
    }
    items.push(<Box key={`child-${index}`} sx={{ flex: 1, minWidth: 0 }}>{child}</Box>);
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'grey.200',
        px: { xs: 2, sm: 3 },
        py: 1.5,
        ...sx,
      }}
    >
      {items}
    </Box>
  );
};
