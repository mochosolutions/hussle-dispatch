import { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, useMediaQuery } from '@mui/material';
import NavGroup from './NavGroup';
import useLayoutState from '../../../../../../hooks/useLayoutState';
import useConfig from '../../../../../../hooks/useConfig';
import { HORIZONTAL_MAX_ITEM } from '../../../../../../config';
import type { NavItemType } from '../../../../../../types/menu';
import { MenuOrientation } from '../../../../../../types/config';

interface NavigationProps {
  menuItems: NavItemType[];
}

const Navigation = ({ menuItems }: NavigationProps) => {
  const theme = useTheme();

  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuOrientation } = useConfig();
  const { drawerOpen } = useLayoutState();
  const [selectedItems, setSelectedItems] = useState<string | undefined>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(0);

  // Local state for active item and selected group (previously in Redux)
  const [openItem, setOpenItem] = useState<string[]>(['dashboard']);
  const [selectedID, setSelectedID] = useState<string | null>(null);

  const handleActiveItem = useCallback((itemIds: string[]) => {
    setOpenItem(itemIds);
  }, []);

  const handleActiveID = useCallback((id: string) => {
    setSelectedID(id);
  }, []);

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  const lastItem = isHorizontal ? HORIZONTAL_MAX_ITEM : null;
  let lastItemIndex = menuItems.length - 1;
  let remItems: NavItemType[] = [];
  let lastItemId = '';

  if (lastItem && lastItem < menuItems.length) {
    lastItemId = menuItems[lastItem - 1].id ?? '';
    lastItemIndex = lastItem - 1;
    remItems = menuItems.slice(lastItem - 1, menuItems.length).map((item) => ({
      title: item.title,
      elements: item.children,
      icon: item.icon,
    }));
  }

  const navGroups = menuItems.slice(0, lastItemIndex + 1).map((item) => {
    switch (item.type) {
      case 'group':
        return (
          <NavGroup
            key={item.id}
            setSelectedItems={setSelectedItems}
            setSelectedLevel={setSelectedLevel}
            selectedLevel={selectedLevel}
            selectedItems={selectedItems}
            lastItem={lastItem ?? 0}
            remItems={remItems}
            lastItemId={lastItemId}
            item={item}
            openItem={openItem}
            onActiveItem={handleActiveItem}
            selectedID={selectedID}
            onActiveID={handleActiveID}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });
  return (
    <Box
      sx={{
        // pt: drawerOpen && !isHorizontal ? 2 : 0,
        '& > ul:first-of-type': { mt: 0 },
        display: isHorizontal ? { xs: 'block', lg: 'flex' } : 'block',
      }}
    >
      {navGroups}
    </Box>
  );
};

export default Navigation;
