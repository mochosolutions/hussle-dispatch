import { useCallback, useRef, useState } from 'react';

import {
  ButtonGroup,
  Button,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';

import type { FormState } from '../../../../mocho/types/form';

type CreateLoadAction = 'booked' | 'draft';

interface ActionOption {
  key: CreateLoadAction;
  label: string;
  busyLabel: string;
}

const ACTION_OPTIONS: ActionOption[] = [
  { key: 'booked', label: 'Create as Booked', busyLabel: 'Creating...' },
  { key: 'draft', label: 'Save as Draft', busyLabel: 'Saving...' },
];

interface CreateLoadActionsProps {
  formState: FormState;
  isCreating?: boolean;
  onSaveDraft: () => void;
  onCreateBooked: () => void;
}

export const CreateLoadActions: React.FC<CreateLoadActionsProps> = ({
  formState,
  isCreating = false,
  onSaveDraft,
  onCreateBooked,
}) => {
  const [selectedAction, setSelectedAction] = useState<CreateLoadAction>('booked');
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const busy = formState.isSubmitting || isCreating;

  const activeOption = ACTION_OPTIONS.find((opt) => opt.key === selectedAction);

  const handlePrimaryClick = useCallback(() => {
    if (selectedAction === 'booked') {
      onCreateBooked();
    } else {
      onSaveDraft();
    }
  }, [selectedAction, onCreateBooked, onSaveDraft]);

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleMenuItemClick = useCallback((key: CreateLoadAction) => {
    setSelectedAction(key);
    setMenuOpen(false);
  }, []);

  const handleCloseMenu = useCallback((event: Event) => {
    if (anchorRef.current?.contains(event.target as HTMLElement)) {
      return;
    }
    setMenuOpen(false);
  }, []);

  return (
    <>
      <ButtonGroup variant="contained" ref={anchorRef} aria-label="create load actions">
        <Button onClick={handlePrimaryClick} disabled={busy}>
          {busy ? activeOption?.busyLabel : activeOption?.label}
        </Button>
        <Button
          size="small"
          aria-controls={menuOpen ? 'create-load-split-menu' : undefined}
          aria-expanded={menuOpen ? 'true' : undefined}
          aria-label="select create action"
          aria-haspopup="menu"
          onClick={handleToggleMenu}
          disabled={busy}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 1 }}
        open={menuOpen}
        anchorEl={anchorRef.current}
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
              <ClickAwayListener onClickAway={handleCloseMenu}>
                <MenuList id="create-load-split-menu" autoFocusItem>
                  {ACTION_OPTIONS.map((option) => (
                    <MenuItem
                      key={option.key}
                      selected={option.key === selectedAction}
                      onClick={() => handleMenuItemClick(option.key)}
                    >
                      <ListItemIcon sx={{ visibility: option.key === selectedAction ? 'visible' : 'hidden' }}>
                        <CheckIcon fontSize="small" />
                      </ListItemIcon>
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
