import { useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { ConfirmDialog } from 'mocho/components';

import { useSelector } from 'store';

import { PHASE_LABELS } from '../../constants';
import {
  selectCompletedPhases,
  selectCurrentPhase,
  selectIsSavingAnswer,
  selectLastSavedAt,
} from '../../store/selectors/portalSelectors';
import PortalHeader from '../PortalHeader';
import PortalStepper from '../PortalStepper';
import PortalFooterBar from '../PortalFooterBar';

interface PortalLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  phaseNumber?: number;
  totalPhases?: number;
  onBack?: () => void;
  onContinue?: () => void;
  isContinuing?: boolean;
  canContinue?: boolean;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  showFooter = true,
  phaseNumber,
  totalPhases,
  onBack,
  onContinue,
  isContinuing = false,
  canContinue = true,
}) => {
  const currentPhase = useSelector(selectCurrentPhase);
  const completedPhases = useSelector(selectCompletedPhases);
  const savingAnswer = useSelector(selectIsSavingAnswer);
  const lastSavedAt = useSelector(selectLastSavedAt);
  const [exitOpen, setExitOpen] = useState(false);

  const phaseLabel = PHASE_LABELS[currentPhase - 1] ?? PHASE_LABELS[0];

  const handleExitConfirm = () => {
    setExitOpen(false);
    window.close();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
      <PortalHeader savingAnswer={savingAnswer} lastSavedAt={lastSavedAt} />
      <PortalStepper
        phases={[...PHASE_LABELS]}
        activePhase={currentPhase}
        completedPhases={completedPhases}
      />

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 }, pb: { xs: 10, md: 12 } }}>
        {children}
      </Container>

      {showFooter ? (
        <PortalFooterBar
          phaseLabel={phaseLabel}
          phaseNumber={phaseNumber}
          totalPhases={totalPhases}
          onBack={onBack}
          onContinue={onContinue}
          isContinuing={isContinuing}
          canContinue={canContinue}
          onSaveExit={() => setExitOpen(true)}
        />
      ) : null}

      <ConfirmDialog
        open={exitOpen}
        title="All set for now"
        content="Your progress is saved. Come back any time using the same invitation link to pick up where you left off."
        confirmLabel="Got it"
        cancelLabel="Keep going"
        severity="info"
        onConfirm={handleExitConfirm}
        onClose={() => setExitOpen(false)}
      />
    </Box>
  );
};

export default PortalLayout;
