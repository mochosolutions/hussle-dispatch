import { useEffect } from 'react';
import { SnackbarProvider } from 'notistack';
import { Outlet, useNavigate } from 'react-router-dom';
import ThemeCustomization from '@mocho/ui/theme';
import { setNavigate } from 'store/middleware/createSagaMiddleware';

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <ThemeCustomization>
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Outlet />
      </SnackbarProvider>
    </ThemeCustomization>
  );
};

export default App;
