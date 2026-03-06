import { useCallback, useMemo, useState, type ReactNode } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import type { ButtonProps } from '@mui/material/Button';
import type { ButtonGroupProps } from '@mui/material/ButtonGroup';

export interface SplitButtonOption {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

interface SplitButtonProps {
  options: SplitButtonOption[];
  initialSelectedIndex?: number;
  buttonGroupAriaLabel?: string;
  menuAriaLabel?: string;
  buttonVariant?: ButtonGroupProps['variant'];
  buttonSize?: ButtonProps['size'];
  showOptionIcons?: boolean;
  primaryButtonIcon?: ReactNode;
  iconOnlyPrimary?: boolean;
  primaryButtonAriaLabel?: string;
  onSelectionChange?: (index: number, option: SplitButtonOption) => void;
}

const SplitButton: React.FC<SplitButtonProps> = ({
  options,
  initialSelectedIndex = 0,
  buttonGroupAriaLabel = 'Split button',
  menuAriaLabel = 'Select option',
  buttonVariant = 'contained',
  buttonSize = 'medium',
  showOptionIcons = true,
  primaryButtonIcon,
  iconOnlyPrimary = false,
  primaryButtonAriaLabel,
  onSelectionChange,
}) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const hasOptions = options.length > 0;
  const safeInitialIndex =
    initialSelectedIndex >= 0 && initialSelectedIndex < options.length ? initialSelectedIndex : 0;
  const [selectedIndex, setSelectedIndex] = useState(safeInitialIndex);

  const selectedOption = useMemo(() => options[selectedIndex], [options, selectedIndex]);
  const effectivePrimaryIcon = primaryButtonIcon ?? selectedOption?.icon;

  const handleAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorEl(node);
  }, []);

  const handleClick = () => {
    if (!selectedOption || selectedOption.disabled) {
      return;
    }

    selectedOption.onClick();
  };

  const handleMenuItemClick = (index: number) => {
    setSelectedIndex(index);
    setOpen(false);
    onSelectionChange?.(index, options[index]);
  };

  const handleToggle = () => {
    if (!hasOptions) {
      return;
    }

    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (!(event.target instanceof Node)) {
      setOpen(false);
      return;
    }

    if (anchorEl?.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <ButtonGroup variant={buttonVariant} ref={handleAnchorRef} aria-label={buttonGroupAriaLabel}>
        <Button
          onClick={handleClick}
          size={buttonSize}
          disabled={!selectedOption || selectedOption.disabled}
          startIcon={iconOnlyPrimary ? undefined : effectivePrimaryIcon}
          aria-label={primaryButtonAriaLabel}
        >
          {iconOnlyPrimary && effectivePrimaryIcon
            ? effectivePrimaryIcon
            : (selectedOption?.label ?? 'Select option')}
        </Button>
        <Button
          size={buttonSize}
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label={menuAriaLabel}
          aria-haspopup="menu"
          onClick={handleToggle}
          disabled={!hasOptions}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.id}
                      disabled={option.disabled}
                      selected={index === selectedIndex}
                      onClick={() => handleMenuItemClick(index)}
                    >
                      {showOptionIcons && option.icon ? (
                        <ListItemIcon>{option.icon}</ListItemIcon>
                      ) : null}
                      <ListItemText>{option.label}</ListItemText>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default SplitButton;
