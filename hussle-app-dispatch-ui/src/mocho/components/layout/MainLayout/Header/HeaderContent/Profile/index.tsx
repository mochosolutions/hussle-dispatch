import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ButtonBase,
  CardContent,
  ClickAwayListener,
  Grid,
  Paper,
  Popper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';

import Avatar from '../../../../../extended/Avatar';
import MainCard from '../../../../../MainCard';
import Transitions from '../../../../../extended/Transitions';
import IconButton from '../../../../../extended/IconButton';

import { ThemeMode } from '../../../../../../types/config';

export interface ProfileProps {
  user?: { name: string; organizationName?: string; avatar?: string };
  onLogout?: () => void;
  onSettings?: () => void;
}

const Profile = ({ user, onLogout, onSettings }: ProfileProps) => {
  const theme = useTheme();

  const userFullName = user?.name ?? 'User';
  const currentOrgName = user?.organizationName ?? 'No active organization';

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleSettings = () => {
    setOpen(false);
    if (onSettings) {
      onSettings();
    }
  };

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const anchorRef = (el: HTMLButtonElement | null) => { setAnchorEl(el); };
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorEl && anchorEl.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  const iconBackColorOpen =
    theme.palette.mode === ThemeMode.DARK ? 'grey.200' : 'grey.300';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={{
          p: 0.25,
          bgcolor: open ? iconBackColorOpen : 'transparent',
          borderRadius: 1,
          '&:hover': {
            bgcolor:
              theme.palette.mode === ThemeMode.DARK
                ? 'secondary.light'
                : 'secondary.lighter',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.secondary.dark}`,
            outlineOffset: 2,
          },
        }}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 0.5 }}>
          <Typography variant="subtitle1" textTransform="capitalize">
            {userFullName}
          </Typography>
        </Stack>
      </ButtonBase>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 9],
              },
            },
          ],
        }}
      >
        {({ TransitionProps }) => (
          <Transitions
            type="grow"
            position="top-right"
            in={open}
            {...TransitionProps}
          >
            <Paper
              sx={{
                display: 'flex',
                boxShadow: theme.customShadows.z1,
                width: '100%',
                minWidth: 240,
                maxWidth: 290,
                [theme.breakpoints.down('md')]: {
                  maxWidth: 250,
                },
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  elevation={0}
                  border={false}
                  content={false}
                  sx={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Grid
                      container
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Grid item>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                        >
                          <Avatar
                            alt="profile user"
                            src={user?.avatar}
                            sx={{ width: 32, height: 32 }}
                          />
                          <Stack>
                            <Typography variant="h6" textTransform="capitalize">
                              {userFullName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                            />
                          </Stack>
                        </Stack>
                      </Grid>
                      <Grid item>
                        <Stack direction="row" spacing={0.5}>
                          {onSettings && (
                            <Tooltip title="Settings">
                              <IconButton
                                size="large"
                                sx={{ color: 'text.primary' }}
                                onClick={handleSettings}
                                aria-label="settings"
                              >
                                <SettingOutlined />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Logout">
                            <IconButton
                              size="large"
                              sx={{ color: 'text.primary' }}
                              onClick={handleLogout}
                            >
                              <LogoutOutlined />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        textTransform="capitalize"
                      >
                        {currentOrgName}
                      </Typography>
                    </Box>
                  </CardContent>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
};

export default Profile;
