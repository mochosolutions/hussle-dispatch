import { useCallback, useEffect } from 'react';
import { SnackbarProvider } from 'notistack';
import { Outlet, useNavigate } from 'react-router-dom';
import ThemeCustomization from '@mocho/ui/theme';
import { useSelector, useDispatch } from 'store';
import { setNavigate } from 'store/middleware/createSagaMiddleware';
import { DrawerManager, ModalManager } from 'mocho/components';
import drawerRegistry from 'features/ui/drawerRegistry';
import modalRegistry from 'features/ui/modalRegistry';
import { currentDrawerSelector } from 'features/ui/store/selectors/drawerSelectors';
import { currentModalSelector } from 'features/ui/store/selectors/modalSelectors';
import { closeDrawer, closeModal } from 'features/ui/store/reducers/uiSlice';

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
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Outlet />
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
    </ThemeCustomization>
  );
};

export default App;
