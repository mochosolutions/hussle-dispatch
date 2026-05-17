import type { Phase, Predicate } from '../engine';

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const hasEmployeesYes: Predicate = {
  op: 'eq',
  field: 'answers.drivers-has-employees.hasEmployeeDrivers',
  value: 'yes',
};

const hasEmployeesNo: Predicate = {
  op: 'eq',
  field: 'answers.drivers-has-employees.hasEmployeeDrivers',
  value: 'no',
};

export const driversPhase: Phase = {
  id: 'drivers',
  label: 'Drivers',
  steps: [
    {
      id: 'drivers-has-employees',
      type: 'input',
      title: 'Do you have employee drivers?',
      questions: [
        {
          id: 'hasEmployeeDrivers',
          label: 'Do you have employee drivers?',
          fieldType: 'select',
          options: YES_NO_OPTIONS,
        },
      ],
    },
    {
      id: 'drivers-list',
      type: 'input',
      title: 'Tell us about your drivers',
      subtitle: 'Add each driver who will run loads for you.',
      visibility: hasEmployeesYes,
      questions: [
        {
          id: 'entries',
          label: 'Drivers',
          fieldType: 'cards',
          helpText:
            'InputStep renderer dispatches to the driver-list builder when question id is "entries".',
        },
      ],
    },
    {
      id: 'drivers-solo-confirm',
      type: 'review',
      title: "Got it — you're the only driver running loads.",
      visibility: hasEmployeesNo,
    },
  ],
};
