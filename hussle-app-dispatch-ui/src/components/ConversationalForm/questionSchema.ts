import type { Schema } from 'yup';

type InputType =
  | 'text'
  | 'address'
  | 'currency'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'yesNo'
  | 'presetTiles'
  | 'stateGrid'
  | 'slider'
  | 'tagInput'
  | 'vehicleList'
  | 'driverList'
  | 'documentSign'
  | 'documentUpload';

type BorderColor = 'blue' | 'green' | 'red' | 'grey';

interface SelectOption {
  value: string;
  label: string;
}

interface SubQuestionAlert {
  severity: 'success' | 'warning' | 'error';
  message: string;
}

interface SubQuestionDefinition {
  id: string;
  label: string;
  hint?: string;
  inputType: InputType;
  options?: SelectOption[];
  validation?: Schema;
  condition?: (answers: Record<string, unknown>) => boolean;
  required?: boolean;
  borderColor?: BorderColor;
  categoryTag?: string;
  startAdornment?: string;
  endAdornment?: string;
  yesLabel?: string;
  noLabel?: string;
  badgeText?: string;
  alert?: (value: unknown, answers: Record<string, unknown>) => SubQuestionAlert | null;
}

interface QuestionDefinition {
  id: string;
  phase: number;
  label: string;
  hint?: string;
  inputType: InputType;
  options?: SelectOption[];
  validation?: Schema;
  subQuestions?: SubQuestionDefinition[];
  condition?: (answers: Record<string, unknown>) => boolean;
  required?: boolean;
  startAdornment?: string;
  endAdornment?: string;
  documentType?: string;
}

export type {
  BorderColor,
  InputType,
  QuestionDefinition,
  SelectOption,
  SubQuestionAlert,
  SubQuestionDefinition,
};
