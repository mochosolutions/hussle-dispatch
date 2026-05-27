import type { Phase, Predicate } from '../engine';

const HAS_EMPLOYEES_OPTIONS = [
  {
    value: 'yes',
    label: 'Yes',
    description: 'I employ drivers',
  },
  {
    value: 'no',
    label: 'No',
    description: 'Just me / owner-operator',
  },
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
          fieldType: 'cards',
          options: HAS_EMPLOYEES_OPTIONS,
        },
      ],
    },
    {
      id: 'drivers-list',
      type: 'driversList',
      title: 'Tell us about your drivers',
      subtitle: 'Add each driver who will run loads for you.',
      visibility: hasEmployeesYes,
      questions: [],
    },
    {
      id: 'drivers-solo-confirm',
      type: 'driversSoloConfirm',
      title: "Got it — you're the only driver running loads.",
      visibility: hasEmployeesNo,
    },
  ],
};
