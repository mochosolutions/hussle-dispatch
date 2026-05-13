import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 1;

const TAX_CLASSIFICATION_OPTIONS = [
  { value: 'SOLE_PROPRIETOR', label: 'Individual / Sole Proprietor' },
  { value: 'SINGLE_MEMBER_LLC', label: 'Single-member LLC (disregarded entity)' },
  { value: 'LLC_C_CORP', label: 'LLC — taxed as C-Corporation' },
  { value: 'LLC_S_CORP', label: 'LLC — taxed as S-Corporation' },
  { value: 'LLC_PARTNERSHIP', label: 'LLC — taxed as Partnership' },
  { value: 'C_CORP', label: 'C-Corporation' },
  { value: 'S_CORP', label: 'S-Corporation' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'TRUST_ESTATE', label: 'Trust / Estate' },
];

const TIN_TYPE_OPTIONS = [
  { value: 'EIN', label: 'EIN (Employer Identification Number)' },
  { value: 'SSN', label: 'SSN (Social Security Number)' },
];

export const companyQuestions: QuestionDefinition[] = [
  {
    id: 'company.name',
    phase: PHASE,
    inputType: 'text',
    label: 'Business name',
    hint: 'The name you operate under (DBA or trade name).',
    required: true,
  },
  {
    id: 'company.legalName',
    phase: PHASE,
    inputType: 'text',
    label: 'Legal name (as shown on your tax return)',
    hint: 'Must match what the IRS has on file for your taxpayer ID. For sole proprietors this is usually your personal name.',
    required: true,
  },
  {
    id: 'company.taxClassification',
    phase: PHASE,
    inputType: 'select',
    label: 'Federal tax classification',
    hint: 'How your business is taxed (line 3 on the W-9).',
    options: TAX_CLASSIFICATION_OPTIONS,
    required: true,
  },
  {
    id: 'company.mcNumber',
    phase: PHASE,
    inputType: 'text',
    label: 'MC number',
    hint: "Leave blank if you don't have one.",
    required: true,
  },
  {
    id: 'company.dotNumber',
    phase: PHASE,
    inputType: 'text',
    label: 'DOT number',
    required: true,
  },
  {
    id: 'company.tinType',
    phase: PHASE,
    inputType: 'select',
    label: 'Tax ID type',
    hint: 'Sole proprietors typically use SSN. LLCs and corporations use EIN.',
    options: TIN_TYPE_OPTIONS,
    required: true,
  },
  {
    id: 'company.tin',
    phase: PHASE,
    inputType: 'text',
    label: 'Tax ID number',
    hint: 'EIN format: XX-XXXXXXX. SSN format: XXX-XX-XXXX.',
    required: true,
  },
  {
    id: 'company.phone',
    phase: PHASE,
    inputType: 'text',
    label: 'Company phone number',
    required: true,
  },
  {
    id: 'company.email',
    phase: PHASE,
    inputType: 'text',
    label: 'Company email address',
    required: true,
  },
  {
    id: 'company.address',
    phase: PHASE,
    inputType: 'address',
    label: 'Business address',
    hint: 'Start typing and pick a result from the dropdown.',
    required: true,
  },
];
