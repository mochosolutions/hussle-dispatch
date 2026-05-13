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

/**
 * A preset option for the presetTiles input type.
 * Promoted from PresetTileSelector/index.tsx to a shared export (RESEARCH.md Pitfall 5).
 */
interface PresetOption {
  value: number;
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
  /**
   * Preset tile options for inputType: 'presetTiles'.
   * Typed as PresetOption[] — never use any (RESEARCH.md Pitfall 5).
   */
  presets?: PresetOption[];
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
  PresetOption,
  QuestionDefinition,
  SelectOption,
  SubQuestionAlert,
  SubQuestionDefinition,
};
