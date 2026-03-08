export interface FormHandle {
  submit: () => Promise<void>;
  reset: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  isLoading?: boolean;
}

export type FormStateChangeCallback = (state: FormState) => void;