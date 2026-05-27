import type { Phase, Predicate } from '../engine';

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

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const MC_AUTHORITY_OPTIONS = [
  {
    value: 'yes',
    label: 'Yes',
    description: 'FMCSA verification coming soon — choose No to enter your details manually.',
    disabled: true,
  },
  { value: 'no', label: 'No' },
];

const mcYes: Predicate = {
  op: 'eq',
  field: 'answers.company-authority-question.hasMcAuthority',
  value: 'yes',
};

const mcNo: Predicate = {
  op: 'eq',
  field: 'answers.company-authority-question.hasMcAuthority',
  value: 'no',
};

const noPathWithDba: Predicate = {
  op: 'and',
  clauses: [
    mcNo,
    {
      op: 'eq',
      field: 'answers.company-authority-question.hasDba',
      value: 'yes',
    },
  ],
};

const confirmHasDbaYes: Predicate = {
  op: 'eq',
  field: 'answers.company-confirm.hasDba',
  value: 'yes',
};

export const companyPhase: Phase = {
  id: 'company',
  label: 'Company',
  steps: [
    {
      id: 'company-authority-question',
      type: 'input',
      title: 'Do you have your own MC authority?',
      questions: [
        {
          id: 'hasMcAuthority',
          label: 'Do you have your own MC authority?',
          fieldType: 'cards',
          options: MC_AUTHORITY_OPTIONS,
        },
        {
          id: 'mcNumber',
          label: 'MC number',
          fieldType: 'mc',
          visibility: mcYes,
        },
        {
          id: 'legalName',
          label: 'Legal name (as shown on your tax return)',
          fieldType: 'text',
          helpText:
            'Must match what the IRS has on file for your taxpayer ID. For sole proprietors this is usually your personal name.',
          visibility: mcNo,
          prefillFrom: 'company.legalName',
        },
        {
          id: 'hasDba',
          label: 'Do you operate under a DBA / trade name?',
          fieldType: 'toggle',
          options: YES_NO_OPTIONS,
          visibility: mcNo,
        },
        {
          id: 'dbaName',
          label: 'DBA / trade name',
          fieldType: 'text',
          visibility: noPathWithDba,
          prefillFrom: 'company.dbaName',
        },
        {
          id: 'taxClassification',
          label: 'Federal tax classification',
          fieldType: 'select',
          helpText: 'How your business is taxed (line 3 on the W-9).',
          options: TAX_CLASSIFICATION_OPTIONS,
          visibility: mcNo,
          prefillFrom: 'company.taxClassification',
        },
        {
          id: 'tinType',
          label: 'Tax ID type',
          fieldType: 'select',
          helpText: 'Sole proprietors typically use SSN. LLCs and corporations use EIN.',
          options: TIN_TYPE_OPTIONS,
          visibility: mcNo,
          prefillFrom: 'company.tinType',
        },
        {
          id: 'tin',
          label: 'Tax ID number',
          fieldType: 'tin',
          helpText: 'EIN format: XX-XXXXXXX. SSN format: XXX-XX-XXXX.',
          visibility: mcNo,
          prefillFrom: 'company.tin',
        },
        {
          id: 'dotNumber',
          label: 'DOT number',
          fieldType: 'text',
          optional: true,
          visibility: mcNo,
          prefillFrom: 'company.dotNumber',
        },
        {
          id: 'signatoryName',
          label: 'Signatory name',
          fieldType: 'text',
          visibility: mcNo,
          prefillFrom: 'company.signatoryName',
        },
        {
          id: 'signatoryTitle',
          label: 'Signatory title',
          fieldType: 'text',
          visibility: mcNo,
          prefillFrom: 'company.signatoryTitle',
        },
        {
          id: 'phone',
          label: 'Company phone number',
          fieldType: 'text',
          visibility: mcNo,
          prefillFrom: 'company.phone',
        },
        {
          id: 'email',
          label: 'Company email address',
          fieldType: 'email',
          visibility: mcNo,
          prefillFrom: 'company.email',
        },
        {
          id: 'address',
          label: 'Business address',
          fieldType: 'address',
          helpText: 'Start typing and pick a result from the dropdown.',
          visibility: mcNo,
          // TODO: prefill from company.address+city+state+zip+lat+lng. The
          // address field expects a nested AddressFormValue, but session
          // surfaces flat string columns. Needs a small shape adapter.
        },
      ],
    },
    {
      id: 'company-fmcsa-verification',
      type: 'verification',
      title: 'Looking up your authority...',
      subtitle: 'We use FMCSA data to pre-fill your company details.',
      visibility: mcYes,
      waitingFor: 'fmcsaSnapshot',
    },
    {
      id: 'company-confirm',
      type: 'input',
      title: 'Confirm your company details',
      visibility: mcYes,
      questions: [
        {
          id: 'legalName',
          label: 'Legal name',
          fieldType: 'text',
          prefillFrom: 'fmcsa.legalName',
        },
        {
          id: 'hasDba',
          label: 'Do you operate under a DBA / trade name?',
          fieldType: 'select',
          options: YES_NO_OPTIONS,
        },
        {
          id: 'dbaName',
          label: 'DBA / trade name',
          fieldType: 'text',
          prefillFrom: 'fmcsa.dba',
          optional: true,
          visibility: confirmHasDbaYes,
        },
        {
          id: 'address',
          label: 'Business address',
          fieldType: 'address',
          prefillFrom: 'fmcsa.address',
        },
        {
          id: 'dotNumber',
          label: 'DOT number',
          fieldType: 'text',
          prefillFrom: 'fmcsa.dotNumber',
        },
        {
          id: 'signatoryName',
          label: 'Signatory name',
          fieldType: 'text',
          prefillFrom: 'fmcsa.officerName',
        },
        {
          id: 'signatoryTitle',
          label: 'Signatory title',
          fieldType: 'text',
        },
        {
          id: 'taxClassification',
          label: 'Federal tax classification',
          fieldType: 'select',
          helpText: 'How your business is taxed (line 3 on the W-9).',
          options: TAX_CLASSIFICATION_OPTIONS,
        },
        {
          id: 'tinType',
          label: 'Tax ID type',
          fieldType: 'select',
          helpText: 'Sole proprietors typically use SSN. LLCs and corporations use EIN.',
          options: TIN_TYPE_OPTIONS,
        },
        {
          id: 'tin',
          label: 'Tax ID number',
          fieldType: 'tin',
          helpText: 'EIN format: XX-XXXXXXX. SSN format: XXX-XX-XXXX.',
        },
        {
          id: 'phone',
          label: 'Company phone number',
          fieldType: 'text',
        },
        {
          id: 'email',
          label: 'Company email address',
          fieldType: 'email',
        },
      ],
    },
  ],
};
