import React, { useCallback } from 'react';
import { getIn, type FormikProps } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import { AddressTypeahead } from 'components/AddressTypeahead';
import type { AddressSearchResult } from 'features/place/types';

export interface AddressFieldProps<T> {
  /** Primary Formik field path that holds the address string (used for error display). */
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
  /** Search target — see AddressTypeahead. Defaults to 'address'. */
  mode?: 'facility' | 'address';
  formik: FormikProps<T>;
  /** Derive what the input displays and whether a place is currently selected. */
  getSelectionState: (values: T) => { display: string; hasSelection: boolean };
  /** Populate Formik fields from a chosen result. */
  onResolve: (result: AddressSearchResult, formik: FormikProps<T>) => void;
  /** Clear any Formik fields written by `onResolve`. */
  onClear: (formik: FormikProps<T>) => void;
}

/**
 * Formik-coupled wrapper around `AddressTypeahead` that composes
 * `BaseFieldWrapper` for label/required/error styling.
 *
 * The parent owns the mapping from a search result to Formik fields via the
 * `onResolve` and `onClear` callbacks, and tells the wrapper how to compute
 * the displayed string + selection flag via `getSelectionState`. This keeps
 * the field reusable across flat (carrier) and nested (load stops) schemas.
 */
export const AddressField = <T,>({
  name,
  label,
  required = false,
  placeholder,
  disabled = false,
  helperText,
  mode = 'address',
  formik,
  getSelectionState,
  onResolve,
  onClear,
}: AddressFieldProps<T>) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const { display, hasSelection } = getSelectionState(formik.values);

  const handleSelect = useCallback(
    (result: AddressSearchResult) => onResolve(result, formik),
    [formik, onResolve],
  );

  const handleClear = useCallback(() => onClear(formik), [formik, onClear]);

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
      helperText={helperText}
    >
      <AddressTypeahead
        id={name}
        value={display}
        hasSelection={hasSelection}
        onSelect={handleSelect}
        onClear={handleClear}
        disabled={disabled}
        placeholder={placeholder}
        mode={mode}
      />
    </BaseFieldWrapper>
  );
};

export default AddressField;
