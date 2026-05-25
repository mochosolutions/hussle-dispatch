import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

const CarrierPortalPage = lazy(() => import('../pages/CarrierPortalPage'));
const StepRouter = lazy(() => import('../pages/CarrierPortalPage/StepRouter'));

const PageFallback = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress />
  </Box>
);

const carrierPortalV2Routes = {
  path: 'carrier-portal/:token',
  element: (
    <Suspense fallback={<PageFallback />}>
      <CarrierPortalPage />
    </Suspense>
  ),
  children: [
    {
      // ':stepId/*' wildcard captures trailing segments — only AgreementSigningStep
      // currently interprets them (for /sign-agreement/:agreementKey + /signed).
      // Other steps ignore the splat and render normally.
      path: ':stepId/*',
      element: (
        <Suspense fallback={<PageFallback />}>
          <StepRouter />
        </Suspense>
      ),
    },
  ],
};

export default carrierPortalV2Routes;
