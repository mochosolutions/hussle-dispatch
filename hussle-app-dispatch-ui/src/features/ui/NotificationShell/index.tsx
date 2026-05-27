import { SnackbarProvider, closeSnackbar, type SnackbarKey } from 'notistack';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import NotificationBridge from 'features/ui/NotificationBridge';

interface NotificationShellProps {
  children: React.ReactNode;
}

const renderCloseAction = (snackbarKey: SnackbarKey) => (
  <IconButton
    size="small"
    onClick={() => closeSnackbar(snackbarKey)}
    aria-label="Close notification"
    sx={{ color: 'common.white' }}
  >
    <CloseIcon fontSize="small" />
  </IconButton>
);

const NotificationShell: React.FC<NotificationShellProps> = ({ children }) => (
  <SnackbarProvider
    maxSnack={3}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    autoHideDuration={5000}
    action={renderCloseAction}
  >
    {children}
    <NotificationBridge />
  </SnackbarProvider>
);

export default NotificationShell;
