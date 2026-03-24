import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: ActionMenuItem) => {
    handleClose();
    item.onClick();
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen} aria-label="More actions">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            sx={item.danger ? { color: 'error.main' } : undefined}
          >
            {item.icon && (
              <ListItemIcon sx={item.danger ? { color: 'error.main' } : undefined}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
