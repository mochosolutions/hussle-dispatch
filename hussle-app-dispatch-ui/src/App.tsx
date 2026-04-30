import { useCallback, useEffect } from 'react';
import { SnackbarProvider, closeSnackbar, type SnackbarKey } from 'notistack';
import { Outlet, useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ThemeCustomization from '@mocho/ui/theme';
import { useSelector, useDispatch } from 'store';
import { setNavigate } from 'store/middleware/createSagaMiddleware';
import { DrawerManager, ModalManager } from 'mocho/components';
import drawerRegistry from 'features/ui/drawerRegistry';
import modalRegistry from 'features/ui/modalRegistry';
import { currentDrawerSelector } from 'features/ui/store/selectors/drawerSelectors';
import { currentModalSelector } from 'features/ui/store/selectors/modalSelectors';
import { closeDrawer, closeModal } from 'features/ui/store/reducers/uiSlice';
import NotificationBridge from 'features/ui/NotificationBridge';

// Default close button rendered on every toast. notistack v3's
// `closeSnackbar` is a top-level helper that goes through the same provider
// ref as `enqueueSnackbar`, so no hook is needed.
//
// notistack import allowed here only — all other consumers (sagas,
// components) should go through the Redux notification slice once US-15 lands.
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

const App = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeDrawer = useSelector(currentDrawerSelector);
  const activeModal = useSelector(currentModalSelector);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  const handleCloseDrawer = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  return (
    <ThemeCustomization>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={5000}
        action={renderCloseAction}
      >
        <Outlet />
        <NotificationBridge />
        <DrawerManager
          activeDrawer={activeDrawer}
          componentLookup={drawerRegistry}
          onClose={handleCloseDrawer}
        />
        <ModalManager
          activeModal={activeModal}
          componentLookup={modalRegistry}
          onClose={handleCloseModal}
        />
      </SnackbarProvider>
      </LocalizationProvider>
    </ThemeCustomization>
  );
};

export default App;
