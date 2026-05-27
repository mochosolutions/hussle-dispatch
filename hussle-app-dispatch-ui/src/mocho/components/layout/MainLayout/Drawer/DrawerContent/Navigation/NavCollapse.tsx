import React, { useCallback, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Collapse,
  ClickAwayListener,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Typography,
  useMediaQuery,
} from '@mui/material';

// project import
import NavItem from './NavItem';
import Dot from '../../../../../extended/Dot';
import SimpleBar from '../../../../../third-party/SimpleBar';
import Transitions from '../../../../../extended/Transitions';

import useConfig from '../../../../../../hooks/useConfig';
import useLayoutState from '../../../../../../hooks/useLayoutState';

// assets
import { BorderOutlined, DownOutlined, UpOutlined, RightOutlined } from '@ant-design/icons';

// types
import type { NavItemType } from '../../../../../../types/menu';
import { MenuOrientation, ThemeMode } from '../../../../../../types/config';

interface VirtualElement {
  getBoundingClientRect: () => ClientRect | DOMRect;
  contextElement?: Element;
}

// mini-menu - wrapper
const PopperStyled = styled(Popper)(({ theme }) => ({
  overflow: 'visible',
  zIndex: 1202,
  minWidth: 180,
  '&:before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: 38,
    left: -5,
    width: 10,
    height: 10,
    backgroundColor: theme.palette.background.paper,
    transform: 'translateY(-50%) rotate(45deg)',
    zIndex: 120,
    borderLeft: `1px solid ${theme.palette.grey[900]}`,
    borderBottom: `1px solid ${theme.palette.grey[900]}`,
  },
}));

// ==============================|| NAVIGATION - LIST COLLAPSE ||============================== //

interface Props {
  menu: NavItemType;
  level: number;
  parentId: string;
  setSelectedItems: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedItems: string | undefined;
  setSelectedLevel: React.Dispatch<React.SetStateAction<number>>;
  selectedLevel: number;
  openItem: string[];
  onActiveItem: (itemIds: string[]) => void;
}

const NavCollapse = ({
  menu,
  level,
  parentId,
  setSelectedItems,
  selectedItems,
  setSelectedLevel,
  selectedLevel,
  openItem,
  onActiveItem,
}: Props) => {
  const theme = useTheme();

  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const { drawerOpen } = useLayoutState();
  const { menuOrientation } = useConfig();

  const { pathname } = useLocation();

  // Determine whether any child URL matches the current route
  const hasActiveChild = (children: NavItemType[] | undefined): boolean => {
    if (!children) return false;
    return children.some((child) => {
      if (child.url === pathname) return true;
      if (child.children?.length) return hasActiveChild(child.children);
      return false;
    });
  };

  const childIsActive = hasActiveChild(menu.children);

  // Track whether the user has manually toggled this collapse.
  // When null, the open state follows childIsActive automatically.
  // When boolean, it represents the user's explicit choice.
  const [userToggle, setUserToggle] = useState<boolean | null>(null);
  const open = userToggle ?? childIsActive;

  const [anchorEl, setAnchorEl] = useState<
    VirtualElement | (() => VirtualElement) | null | undefined
  >(null);

  const handleClick = useCallback((
    event:
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | undefined,
  ) => {
    setAnchorEl(null);
    setSelectedLevel(level);
    if (drawerOpen) {
      const nextOpen = !open;
      setUserToggle(nextOpen);
      setSelectedItems(nextOpen ? menu.id : '');
    } else {
      setAnchorEl(event?.currentTarget);
    }
  }, [drawerOpen, level, menu.id, open, setSelectedItems, setSelectedLevel]);

  const handleHover = (
    event:
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | undefined,
  ) => {
    setAnchorEl(event?.currentTarget);
  };

  const miniMenuOpened = Boolean(anchorEl);

  const handleClose = () => {
    setUserToggle(false);
    setAnchorEl(null);
  };

  const navCollapse = menu.children?.map((item) => {
    switch (item.type) {
      case 'collapse':
        return (
          <NavCollapse
            key={item.id}
            setSelectedItems={setSelectedItems}
            setSelectedLevel={setSelectedLevel}
            selectedLevel={selectedLevel}
            selectedItems={selectedItems}
            menu={item}
            level={level + 1}
            parentId={parentId}
            openItem={openItem}
            onActiveItem={onActiveItem}
          />
        );
      case 'item':
        return (
          <NavItem
            key={item.id}
            item={item}
            level={level + 1}
            openItem={openItem}
            onActiveItem={onActiveItem}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Collapse or Item
          </Typography>
        );
    }
  });
  const borderIcon = level === 1 ? <BorderOutlined style={{ fontSize: '1rem' }} /> : false;
  const iconProp = menu.icon;
  let menuIcon: ReactNode = borderIcon;
  if (iconProp) {
    if (typeof iconProp === 'function') {
      const Icon = iconProp;
      menuIcon = <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} />;
    } else {
      menuIcon = iconProp;
    }
  }
  const textColor = theme.palette.mode === ThemeMode.DARK ? 'grey.400' : 'text.primary';
  const iconSelectedColor =
    theme.palette.mode === ThemeMode.DARK && drawerOpen
      ? theme.palette.text.primary
      : theme.palette.primary.main;
  const popperId = miniMenuOpened ? `collapse-pop-${menu.id}` : undefined;
  const FlexBox = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  };
  return (
    <>
      {menuOrientation === MenuOrientation.VERTICAL || downLG ? (
        <>
          <ListItemButton
            disableRipple
            selected={childIsActive}
            {...(!drawerOpen && {
              onMouseEnter: handleClick,
              onMouseLeave: handleClose,
            })}
            onClick={handleClick}
            sx={{
              pl: drawerOpen ? `${level * 28}px` : 1.5,
              py: !drawerOpen && level === 1 ? 1.25 : 1,
              ...(drawerOpen && {
                '&:hover': {
                  bgcolor: theme.palette.mode === ThemeMode.DARK ? 'divider' : 'primary.lighter',
                },
                '&.Mui-selected': {
                  bgcolor: 'transparent',
                  color: iconSelectedColor,
                  '&:hover': {
                    color: iconSelectedColor,
                    bgcolor: theme.palette.mode === ThemeMode.DARK ? 'divider' : 'transparent',
                  },
                },
              }),
              ...(!drawerOpen && {
                '&:hover': {
                  bgcolor: 'transparent',
                },
                '&.Mui-selected': {
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                  bgcolor: 'transparent',
                },
              }),
            }}
          >
            {menuIcon && (
              <ListItemIcon
                sx={{
                  minWidth: 28,
                  marginRight: 1,
                  color: childIsActive ? 'primary.main' : textColor,
                  ...(!drawerOpen && {
                    borderRadius: 1.5,
                    width: 36,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor:
                        theme.palette.mode === ThemeMode.DARK
                          ? 'secondary.light'
                          : 'secondary.lighter',
                    },
                  }),
                  ...(!drawerOpen &&
                    childIsActive && {
                      bgcolor:
                        theme.palette.mode === ThemeMode.DARK ? 'primary.900' : 'primary.lighter',
                      '&:hover': {
                        bgcolor:
                          theme.palette.mode === ThemeMode.DARK
                            ? 'primary.dark'
                            : 'primary.lighter',
                      },
                    }),
                }}
              >
                {menuIcon}
              </ListItemIcon>
            )}
            {(drawerOpen || (!drawerOpen && level !== 1)) && (
              <ListItemText
                primary={
                  <Typography variant="h6" color={childIsActive ? 'primary' : textColor}>
                    {menu.title}
                  </Typography>
                }
                secondary={
                  menu.caption && (
                    <Typography variant="caption" color="secondary">
                      {menu.caption}
                    </Typography>
                  )
                }
              />
            )}
            {(drawerOpen || (!drawerOpen && level !== 1)) &&
              (miniMenuOpened || open ? (
                <UpOutlined
                  style={{
                    fontSize: '0.625rem',
                    marginLeft: 1,
                    color: theme.palette.primary.main,
                  }}
                />
              ) : (
                <DownOutlined style={{ fontSize: '0.625rem', marginLeft: 1 }} />
              ))}

            {!drawerOpen && (
              <PopperStyled
                open={miniMenuOpened}
                anchorEl={anchorEl}
                placement="right-start"
                style={{
                  zIndex: 2001,
                }}
                popperOptions={{
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [-12, 1],
                      },
                    },
                  ],
                }}
              >
                {({ TransitionProps }) => (
                  <Transitions in={miniMenuOpened} {...TransitionProps}>
                    <Paper
                      sx={{
                        overflow: 'hidden',
                        mt: 1.5,
                        boxShadow: theme.customShadows.z1,
                        backgroundImage: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <ClickAwayListener onClickAway={handleClose}>
                        <SimpleBar
                          sx={{
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            maxHeight: 'calc(100vh - 170px)',
                          }}
                        >
                          {navCollapse}
                        </SimpleBar>
                      </ClickAwayListener>
                    </Paper>
                  </Transitions>
                )}
              </PopperStyled>
            )}
          </ListItemButton>
          {drawerOpen && (
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List sx={{ p: 0 }}>{navCollapse}</List>
            </Collapse>
          )}
        </>
      ) : (
        <>
          <ListItemButton
            id={`boundary-${popperId}`}
            disableRipple
            selected={childIsActive}
            onMouseEnter={handleHover}
            onMouseLeave={handleClose}
            onClick={handleHover}
            aria-describedby={popperId}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'transparent',
              },
            }}
          >
            <Box sx={FlexBox}>
              {menuIcon && (
                <ListItemIcon
                  sx={{
                    my: 'auto',
                    minWidth: !menu.icon ? 18 : 36,
                    color: theme.palette.secondary.dark,
                  }}
                >
                  {menuIcon}
                </ListItemIcon>
              )}
              {!menuIcon && level !== 1 && (
                <ListItemIcon
                  sx={{
                    my: 'auto',
                    minWidth: !menu.icon ? 18 : 36,
                    bgcolor: 'transparent',
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  <Dot size={4} color={childIsActive ? 'primary' : 'secondary'} />
                </ListItemIcon>
              )}
              <ListItemText
                primary={
                  <Typography variant="body1" color="inherit" sx={{ my: 'auto' }}>
                    {menu.title}
                  </Typography>
                }
              />
              {miniMenuOpened ? <RightOutlined /> : <DownOutlined />}
            </Box>

            {anchorEl && (
              <PopperStyled
                id={popperId}
                open={miniMenuOpened}
                anchorEl={anchorEl}
                placement="right-start"
                style={{
                  zIndex: 2001,
                }}
                modifiers={[
                  {
                    name: 'offset',
                    options: {
                      offset: [-10, 0],
                    },
                  },
                ]}
              >
                {({ TransitionProps }) => (
                  <Transitions in={miniMenuOpened} {...TransitionProps}>
                    <Paper
                      sx={{
                        overflow: 'hidden',
                        mt: 1.5,
                        py: 0.5,
                        boxShadow: theme.shadows[8],
                        backgroundImage: 'none',
                      }}
                    >
                      <ClickAwayListener onClickAway={handleClose}>
                        <SimpleBar
                          sx={{
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            maxHeight: 'calc(100vh - 170px)',
                          }}
                        >
                          {navCollapse}
                        </SimpleBar>
                      </ClickAwayListener>
                    </Paper>
                  </Transitions>
                )}
              </PopperStyled>
            )}
          </ListItemButton>
        </>
      )}
    </>
  );
};

export default NavCollapse;
