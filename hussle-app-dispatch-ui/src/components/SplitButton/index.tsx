import { Fragment, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Divider,
  Grow,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tooltip,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { ButtonProps } from '@mui/material/Button';
import type { ButtonGroupProps } from '@mui/material/ButtonGroup';

export interface SplitButtonItem {
  key: string;
  label: string;
  busyLabel?: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  hidden?: boolean;
  danger?: boolean;
  dividerAfter?: boolean;
}

interface SplitButtonProps {
  items: SplitButtonItem[];
  ariaLabel: string;
  busy?: boolean;
  variant?: 'split' | 'menu' | 'action';
  triggerVariant?: 'text' | 'icon';
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  defaultKey?: string;
  primary?: SplitButtonItem;
  buttonVariant?: ButtonGroupProps['variant'];
  color?: ButtonProps['color'];
  size?: 'small' | 'medium' | 'large';
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  items,
  ariaLabel,
  busy = false,
  variant = 'split',
  triggerVariant = 'text',
  triggerLabel = 'Actions',
  triggerIcon,
  defaultKey,
  primary,
  buttonVariant = 'contained',
  color = 'primary',
  size = 'medium',
}) => {
  const visibleItems = useMemo(() => items.filter((item) => !item.hidden), [items]);

  const renderedItems = useMemo(
    () =>
      visibleItems.map((item, idx) => ({
        ...item,
        dividerAfter: Boolean(item.dividerAfter) && idx < visibleItems.length - 1,
      })),
    [visibleItems]
  );

  const initialKey = defaultKey ?? visibleItems[0]?.key ?? '';
  const [selectedKey, setSelectedKey] = useState<string>(initialKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  const selected = visibleItems.find((item) => item.key === selectedKey) ?? visibleItems[0];

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback((event: Event | React.SyntheticEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      setMenuOpen(false);
      return;
    }
    if (groupRef.current?.contains(target) || iconRef.current?.contains(target)) {
      return;
    }
    setMenuOpen(false);
  }, []);

  const handlePrimaryClick = useCallback(() => {
    if (selected && !selected.disabled) {
      selected.onClick();
    }
  }, [selected]);

  const handleItemClick = useCallback(
    (item: SplitButtonItem) => {
      setMenuOpen(false);
      if (variant === 'split') {
        setSelectedKey(item.key);
      }
      item.onClick();
    },
    [variant]
  );

  if (visibleItems.length === 0) {
    return null;
  }

  const renderTrigger = () => {
    if (variant === 'action' && primary) {
      const primaryLabel = busy && primary.busyLabel ? primary.busyLabel : primary.label;
      return (
        <ButtonGroup
          variant={buttonVariant}
          color={color}
          size={size}
          ref={groupRef}
          aria-label={ariaLabel}
        >
          <Button
            onClick={() => {
              if (!primary.disabled) {
                primary.onClick();
              }
            }}
            startIcon={primary.icon}
            disabled={busy || primary.disabled}
          >
            {primaryLabel}
          </Button>
          <Button
            size="small"
            aria-controls={menuOpen ? 'split-button-menu' : undefined}
            aria-expanded={menuOpen ? 'true' : undefined}
            aria-label={`${ariaLabel} options`}
            aria-haspopup="menu"
            onClick={handleToggleMenu}
            disabled={busy}
          >
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
      );
    }

    if (variant === 'split') {
      const primaryLabel = busy && selected?.busyLabel ? selected.busyLabel : selected?.label;
      return (
        <ButtonGroup
          variant={buttonVariant}
          color={color}
          size={size}
          ref={groupRef}
          aria-label={ariaLabel}
        >
          <Button
            onClick={handlePrimaryClick}
            startIcon={selected?.icon}
            disabled={busy || selected?.disabled}
          >
            {primaryLabel}
          </Button>
          <Button
            size="small"
            aria-controls={menuOpen ? 'split-button-menu' : undefined}
            aria-expanded={menuOpen ? 'true' : undefined}
            aria-label={`${ariaLabel} options`}
            aria-haspopup="menu"
            onClick={handleToggleMenu}
            disabled={busy}
          >
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
      );
    }

    if (triggerVariant === 'icon') {
      const iconSize = size === 'large' ? 'medium' : size;
      return (
        <IconButton
          ref={iconRef}
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={menuOpen ? 'true' : undefined}
          onClick={handleToggleMenu}
          size={iconSize}
          color={color}
        >
          {triggerIcon ?? <MoreVertIcon />}
        </IconButton>
      );
    }

    return (
      <ButtonGroup
        variant={buttonVariant}
        color={color}
        size={size}
        ref={groupRef}
        aria-label={ariaLabel}
      >
        <Button
          aria-controls={menuOpen ? 'split-button-menu' : undefined}
          aria-haspopup="menu"
          aria-expanded={menuOpen ? 'true' : undefined}
          onClick={handleToggleMenu}
          startIcon={triggerIcon}
          endIcon={<ArrowDropDownIcon />}
        >
          {triggerLabel}
        </Button>
      </ButtonGroup>
    );
  };

  const popperAnchor =
    variant === 'menu' && triggerVariant === 'icon' ? iconRef.current : groupRef.current;

  return (
    <>
      {renderTrigger()}
      <Popper
        sx={{ zIndex: 1300 }}
        open={menuOpen}
        anchorEl={popperAnchor}
        role={undefined}
        transition
        disablePortal
        placement="bottom-end"
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement.startsWith('bottom') ? 'right top' : 'right bottom',
            }}
          >
            <Paper elevation={3} sx={{ minWidth: 220 }}>
              <ClickAwayListener onClickAway={handleCloseMenu}>
                <MenuList id="split-button-menu" autoFocusItem={menuOpen}>
                  {renderedItems.map((item) => {
                    const isSelected = variant === 'split' && item.key === selected?.key;
                    const itemSx = item.danger ? { color: 'error.main' } : undefined;
                    const iconSx = item.danger ? { color: 'error.main' } : undefined;

                    const node = (
                      <MenuItem
                        selected={isSelected}
                        disabled={item.disabled}
                        onClick={() => handleItemClick(item)}
                        sx={itemSx}
                      >
                        {variant === 'split' && (
                          <ListItemIcon
                            sx={{ visibility: isSelected ? 'visible' : 'hidden' }}
                          >
                            <CheckIcon fontSize="small" />
                          </ListItemIcon>
                        )}
                        {(variant === 'menu' || variant === 'action') && item.icon && (
                          <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
                        )}
                        <ListItemText>{item.label}</ListItemText>
                      </MenuItem>
                    );

                    const wrapped =
                      item.disabled && item.disabledReason ? (
                        <Tooltip title={item.disabledReason} placement="left">
                          <span style={{ display: 'block' }}>{node}</span>
                        </Tooltip>
                      ) : (
                        node
                      );

                    return (
                      <Fragment key={item.key}>
                        {wrapped}
                        {item.dividerAfter && <Divider />}
                      </Fragment>
                    );
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
