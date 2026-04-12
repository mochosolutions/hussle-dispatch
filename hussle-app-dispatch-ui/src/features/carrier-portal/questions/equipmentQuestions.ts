import type { QuestionDefinition, SubQuestionAlert } from 'components/ConversationalForm/questionSchema';

const PHASE = 2;

const hasVehicleType = (
  answers: Record<string, unknown>,
  vehicleType: string,
): boolean => {
  const types = answers['equipment.vehicleTypes'];
  return Array.isArray(types) && types.includes(vehicleType);
};

const getGvwrAlert = (value: unknown): SubQuestionAlert | null => {
  const gvwr = Number(value);
  if (Number.isNaN(gvwr) || gvwr === 0) {
    return null;
  }
  if (gvwr <= 10000) {
    return { severity: 'success', message: 'Under 10,001 lbs — no DOT registration needed' };
  }
  if (gvwr <= 26000) {
    return {
      severity: 'warning',
      message: '10,001–26,000 lbs — DOT registration optional for intrastate',
    };
  }
  return {
    severity: 'error',
    message: 'Over 26,001 lbs — DOT number required by federal law',
  };
};

export const equipmentQuestions: QuestionDefinition[] = [
  {
    id: 'equipment.vehicleTypes',
    phase: PHASE,
    inputType: 'multiSelect',
    label: 'What types of vehicles do you operate?',
    required: true,
    options: [
      { value: 'SEMI_TRUCK', label: 'Semi Truck' },
      { value: 'BOX_TRUCK', label: 'Box Truck' },
      { value: 'CARGO_VAN', label: 'Cargo Van' },
      { value: 'PERSONAL_VEHICLE', label: 'Personal Vehicle' },
    ],
    subQuestions: [
      // --- SEMI_TRUCK sub-questions ---
      {
        id: 'equipment.semi.mcNumber',
        inputType: 'text',
        label: 'What is your MC number?',
        hint: 'Your Motor Carrier number is required for semi truck operations.',
        categoryTag: 'MC AUTHORITY — REQUIRED',
        borderColor: 'blue',
        startAdornment: 'MC-',
        required: true,
        condition: (answers) => hasVehicleType(answers, 'SEMI_TRUCK'),
      },
      {
        id: 'equipment.semi.dotNumber',
        inputType: 'text',
        label: 'What is your DOT number?',
        hint: 'Your USDOT number is required for semi truck interstate commerce.',
        categoryTag: 'DOT REGISTRATION — REQUIRED',
        borderColor: 'blue',
        startAdornment: 'DOT-',
        required: true,
        condition: (answers) => hasVehicleType(answers, 'SEMI_TRUCK'),
      },
      {
        id: 'equipment.semi.insuranceCost',
        inputType: 'currency',
        label: 'What is your commercial insurance cost per month?',
        categoryTag: 'INSURANCE',
        borderColor: 'blue',
        badgeText: 'Minimum: $1,000,000 commercial auto · $100,000 cargo',
        endAdornment: '/ month',
        condition: (answers) => hasVehicleType(answers, 'SEMI_TRUCK'),
      },

      // --- BOX_TRUCK sub-questions ---
      {
        id: 'equipment.box.gvwr',
        inputType: 'number',
        label: 'What is the Gross Vehicle Weight Rating (GVWR) of your box truck?',
        hint: 'GVWR is the maximum operating weight of your vehicle as specified by the manufacturer. It\'s usually on a sticker inside the driver\'s door. This determines whether DOT registration is required.',
        required: true,
        borderColor: 'blue',
        endAdornment: 'lbs GVWR',
        alert: (value) => getGvwrAlert(value),
        condition: (answers) => hasVehicleType(answers, 'BOX_TRUCK'),
      },
      {
        id: 'equipment.box.dotNumber',
        inputType: 'text',
        label: 'What is your DOT number?',
        hint: 'Your GVWR is over 26,001 lbs which requires USDOT registration for interstate commerce.',
        categoryTag: 'DOT REGISTRATION — REQUIRED',
        borderColor: 'red',
        startAdornment: 'DOT-',
        required: true,
        condition: (answers) => {
          if (!hasVehicleType(answers, 'BOX_TRUCK')) {
            return false;
          }
          const gvwr = Number(answers['equipment.box.gvwr']);
          return !Number.isNaN(gvwr) && gvwr >= 26001;
        },
      },
      {
        id: 'equipment.box.mcHas',
        inputType: 'yesNo',
        label: 'Do you have MC authority?',
        hint: 'Most box truck operators don\'t need MC authority unless they\'re operating as a for-hire carrier crossing state lines with commercial freight.',
        categoryTag: 'MC AUTHORITY — OPTIONAL FOR BOX TRUCKS',
        borderColor: 'green',
        yesLabel: 'Yes, I have MC',
        noLabel: "No, I don't",
        condition: (answers) => hasVehicleType(answers, 'BOX_TRUCK'),
      },
      {
        id: 'equipment.box.mcNumber',
        inputType: 'text',
        label: 'What is your MC number?',
        borderColor: 'green',
        startAdornment: 'MC-',
        condition: (answers) =>
          hasVehicleType(answers, 'BOX_TRUCK') && answers['equipment.box.mcHas'] === true,
      },
      {
        id: 'equipment.box.insuranceCost',
        inputType: 'currency',
        label: 'What is your commercial insurance cost per month?',
        categoryTag: 'INSURANCE',
        borderColor: 'blue',
        badgeText: 'Minimum: $300,000 commercial auto · $100,000 cargo',
        endAdornment: '/ month',
        condition: (answers) => hasVehicleType(answers, 'BOX_TRUCK'),
      },

      // --- CARGO_VAN sub-questions ---
      {
        id: 'equipment.van.mcHas',
        inputType: 'yesNo',
        label: 'Do you have MC authority?',
        hint: 'MC authority is optional for cargo van operators.',
        categoryTag: 'MC AUTHORITY — OPTIONAL',
        borderColor: 'green',
        yesLabel: 'Yes, I have MC',
        noLabel: "No, I don't",
        condition: (answers) => hasVehicleType(answers, 'CARGO_VAN'),
      },
      {
        id: 'equipment.van.mcNumber',
        inputType: 'text',
        label: 'What is your MC number?',
        borderColor: 'green',
        startAdornment: 'MC-',
        condition: (answers) =>
          hasVehicleType(answers, 'CARGO_VAN') && answers['equipment.van.mcHas'] === true,
      },
      {
        id: 'equipment.van.insuranceCost',
        inputType: 'currency',
        label: 'What is your commercial insurance cost per month?',
        categoryTag: 'INSURANCE',
        borderColor: 'blue',
        badgeText: 'Minimum: $300,000 commercial auto',
        endAdornment: '/ month',
        condition: (answers) => hasVehicleType(answers, 'CARGO_VAN'),
      },

      // --- PERSONAL_VEHICLE sub-questions ---
      {
        id: 'equipment.pv.deliveryTypes',
        inputType: 'multiSelect',
        label: 'What types of deliveries will you run?',
        categoryTag: 'DELIVERY TYPES — REQUIRED',
        borderColor: 'blue',
        required: true,
        options: [
          { value: 'COURIER', label: 'Courier / Same-Day' },
          { value: 'LAST_MILE', label: 'Last Mile' },
          { value: 'MEDICAL_COURIER', label: 'Medical Courier' },
          { value: 'GROCERY', label: 'Grocery' },
          { value: 'PHARMACY', label: 'Pharmacy' },
          { value: 'OTHER', label: 'Other' },
        ],
        condition: (answers) => hasVehicleType(answers, 'PERSONAL_VEHICLE'),
      },
      {
        id: 'equipment.pv.transportsPharma',
        inputType: 'yesNo',
        label: 'Do you transport pharmaceuticals?',
        categoryTag: 'MEDICAL COURIER COMPLIANCE',
        borderColor: 'red',
        condition: (answers) => {
          if (!hasVehicleType(answers, 'PERSONAL_VEHICLE')) {
            return false;
          }
          const deliveryTypes = answers['equipment.pv.deliveryTypes'];
          return Array.isArray(deliveryTypes) && deliveryTypes.includes('MEDICAL_COURIER');
        },
      },
      {
        id: 'equipment.pv.controlledSubstances',
        inputType: 'yesNo',
        label: 'Do those include controlled substances?',
        borderColor: 'red',
        condition: (answers) => {
          if (!hasVehicleType(answers, 'PERSONAL_VEHICLE')) {
            return false;
          }
          return answers['equipment.pv.transportsPharma'] === true;
        },
      },
      {
        id: 'equipment.pv.insuranceCost',
        inputType: 'currency',
        label: 'What is your commercial insurance cost per month?',
        hint: 'Requires commercial auto rider on your personal policy.',
        categoryTag: 'INSURANCE',
        borderColor: 'blue',
        badgeText: 'Minimum: $300,000 commercial auto',
        endAdornment: '/ month',
        condition: (answers) => hasVehicleType(answers, 'PERSONAL_VEHICLE'),
      },
    ],
  },
  {
    id: 'equipment.vehicles',
    phase: PHASE,
    inputType: 'text',
    label: 'Vehicle details will be collected here',
    hint: 'Repeatable vehicle entry cards',
  },
];
