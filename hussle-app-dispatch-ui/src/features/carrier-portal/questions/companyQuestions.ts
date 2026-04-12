import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 1;

const isFactoring = (answers: Record<string, unknown>): boolean =>
  answers['company.factoring'] === true;

export const companyQuestions: QuestionDefinition[] = [
  {
    id: 'company.name',
    phase: PHASE,
    inputType: 'text',
    label: 'What is your company name?',
    required: true,
  },
  {
    id: 'company.mcNumber',
    phase: PHASE,
    inputType: 'text',
    label: 'What is your MC number?',
    hint: "Leave blank if you don't have one",
  },
  {
    id: 'company.dotNumber',
    phase: PHASE,
    inputType: 'text',
    label: 'What is your DOT number?',
  },
  {
    id: 'company.ein',
    phase: PHASE,
    inputType: 'text',
    label: 'What is your EIN?',
  },
  {
    id: 'company.phone',
    phase: PHASE,
    inputType: 'text',
    label: 'Company phone number?',
  },
  {
    id: 'company.email',
    phase: PHASE,
    inputType: 'text',
    label: 'Company email address?',
  },
  {
    id: 'company.address',
    phase: PHASE,
    inputType: 'text',
    label: 'Company address?',
  },
  {
    id: 'company.city',
    phase: PHASE,
    inputType: 'text',
    label: 'City?',
  },
  {
    id: 'company.state',
    phase: PHASE,
    inputType: 'text',
    label: 'State?',
    hint: '2-letter abbreviation (e.g., TX)',
  },
  {
    id: 'company.zip',
    phase: PHASE,
    inputType: 'text',
    label: 'ZIP code?',
  },
  {
    id: 'company.primaryContactName',
    phase: PHASE,
    inputType: 'text',
    label: 'Who is your primary contact?',
  },
  {
    id: 'company.primaryContactPhone',
    phase: PHASE,
    inputType: 'text',
    label: 'Primary contact phone?',
  },
  {
    id: 'company.primaryContactEmail',
    phase: PHASE,
    inputType: 'text',
    label: 'Primary contact email?',
  },
  {
    id: 'company.factoring',
    phase: PHASE,
    inputType: 'yesNo',
    label: 'Do you use a factoring company?',
  },
  {
    id: 'company.factoringCompanyName',
    phase: PHASE,
    inputType: 'text',
    label: 'Factoring company name?',
    condition: isFactoring,
  },
  {
    id: 'company.factoringCompanyEmail',
    phase: PHASE,
    inputType: 'text',
    label: 'Factoring company email?',
    condition: isFactoring,
  },
  {
    id: 'company.factoringSubmissionMethod',
    phase: PHASE,
    inputType: 'select',
    label: 'How do you submit to factoring?',
    options: [
      { value: 'EMAIL', label: 'Email' },
      { value: 'PORTAL', label: 'Portal' },
    ],
    condition: isFactoring,
  },
  {
    id: 'company.factoringAdvanceRate',
    phase: PHASE,
    inputType: 'number',
    label: 'Factoring advance rate (%)?',
    condition: isFactoring,
  },
  {
    id: 'company.factoringFeePercent',
    phase: PHASE,
    inputType: 'number',
    label: 'Factoring fee (%)?',
    condition: isFactoring,
  },
  {
    id: 'company.fuelCards',
    phase: PHASE,
    inputType: 'tagInput',
    label: 'Which fuel card providers do you use?',
    hint: 'Type and press Enter to add',
  },
  {
    id: 'company.howFoundUs',
    phase: PHASE,
    inputType: 'text',
    label: 'How did you find us?',
  },
];
