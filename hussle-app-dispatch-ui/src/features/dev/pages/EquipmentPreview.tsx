import { Box } from '@mui/material';

import { SteppedConversationalForm } from 'components/SteppedConversationalForm';
import { companyQuestions } from 'features/carrier-portal/questions/companyQuestions';
import { equipmentQuestions } from 'features/carrier-portal/questions/equipmentQuestions';
import { driversQuestions } from 'features/carrier-portal/questions/driversQuestions';
import { costAnalysisQuestions } from 'features/carrier-portal/questions/costAnalysisQuestions';

const PHASES = ['Company', 'Equipment', 'Drivers', 'Cost Analysis', 'Lane Preferences', 'Documents'];

const prefilledAnswers: Record<string, unknown> = {
  'equipment.vehicleTypes': ['BOX_TRUCK'],
};

const handleAnswerChange = (id: string, value: unknown) => {
  // eslint-disable-next-line no-console
  console.log('Answer changed:', id, value);
};

const handlePhaseComplete = (phase: number) => {
  // eslint-disable-next-line no-console
  console.log('Phase complete:', phase);
};

const handleSubmit = (values: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.log('Form submitted:', values);
};

const EquipmentPreview = () => (
  <Box
    sx={{
      maxWidth: 720,
      mx: 'auto',
      py: 4,
      px: 3,
      minHeight: '100vh',
      bgcolor: 'background.paper',
    }}
  >
    <SteppedConversationalForm
      questions={[
        ...companyQuestions,
        ...equipmentQuestions,
        ...driversQuestions,
        ...costAnalysisQuestions,
      ]}
      phases={PHASES}
      initialValues={prefilledAnswers}
      initialPhase={2}
      onAnswerChange={handleAnswerChange}
      onPhaseComplete={handlePhaseComplete}
      onSubmit={handleSubmit}
    />
  </Box>
);

export default EquipmentPreview;
