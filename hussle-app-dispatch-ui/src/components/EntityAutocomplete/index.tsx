import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { TypeaheadField } from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';

export interface EntityAutocompleteOption {
  value: string;
  label: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface EntityAutocompleteProps {
  name: string;
  label: string;
  formik: FormikFieldProps;
  fetchOptions: (
    search: string,
    scopeParams?: Record<string, string>,
  ) => Promise<EntityAutocompleteOption[]>;
  scopeParams?: Record<string, string>;
  renderOptionContent?: (option: EntityAutocompleteOption) => React.ReactNode;
  createNewLabel?: string;
  onCreateNew?: () => void;
  renderInlineCreate?: (props: { onCreated: (id: string) => void; onCancel: () => void }) => React.ReactNode;
  onSelect?: (option: EntityAutocompleteOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  noOptionsText?: string;
  startAdornment?: React.ReactNode;
}

const DEBOUNCE_MS = 300;

interface InlineCreateSectionProps {
  formik: FormikFieldProps;
  name: string;
  renderInlineCreate: (props: { onCreated: (id: string) => void; onCancel: () => void }) => React.ReactNode;
  onRefetch: () => void;
  onClose: () => void;
}

/**
 * Extracted component for the inline create form to isolate
 * event handler creation from the parent render path.
 */
const InlineCreateSection: React.FC<InlineCreateSectionProps> = ({
  formik,
  name,
  renderInlineCreate,
  onRefetch,
  onClose,
}) => {
  const handleCreated = useCallback(
    (newId: string) => {
      formik.setFieldValue(name, newId);
      onClose();
      onRefetch();
    },
    [formik, name, onClose, onRefetch],
  );

  return (
    <Box sx={{ mt: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      {renderInlineCreate({
        onCreated: handleCreated,
        onCancel: onClose,
      })}
    </Box>
  );
};

/**
 * EntityAutocomplete wraps TypeaheadField with debounced async search,
 * request cancellation, and an optional inline create form.
 */
export const EntityAutocomplete: React.FC<EntityAutocompleteProps> = ({
  name,
  label,
  formik,
  fetchOptions,
  scopeParams,
  renderOptionContent,
  createNewLabel,
  onCreateNew,
  renderInlineCreate,
  onSelect,
  placeholder,
  disabled = false,
  required = false,
  helperText,
  noOptionsText,
  startAdornment,
}) => {
  const [options, setOptions] = useState<EntityAutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    const timer = setTimeout(() => {
      fetchOptions(inputValue, scopeParams)
        .then((results) => {
          if (requestIdRef.current === nextRequestId) {
            setOptions(results);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (requestIdRef.current === nextRequestId) {
            setOptions([]);
            setIsLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue, scopeParams, fetchOptions]);

  const handleInputValueChange = useCallback((value: string) => {
    setInputValue(value);
    setIsLoading(true);
  }, []);

  const handleOptionSelect = useCallback(
    (option: EntityAutocompleteOption | null) => {
      onSelect?.(option);
    },
    [onSelect],
  );

  const handleActionButtonClick = useCallback(() => {
    if (renderInlineCreate) {
      setShowInlineCreate(true);
    } else {
      onCreateNew?.();
    }
  }, [renderInlineCreate, onCreateNew]);

  const refetchOptions = useCallback(() => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;
    fetchOptions('', scopeParams).then((results) => {
      if (requestIdRef.current === nextRequestId) {
        setOptions(results);
      }
    });
  }, [fetchOptions, scopeParams]);

  const handleCancel = useCallback(() => {
    setShowInlineCreate(false);
  }, []);

  const actionButtonLabel = createNewLabel ?? undefined;
  const hasActionButton = Boolean(actionButtonLabel);

  return (
    <Box>
      <TypeaheadField
        name={name}
        label={label}
        formik={formik}
        options={options}
        loading={isLoading}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        helperText={helperText}
        noOptionsText={noOptionsText}
        startAdornment={startAdornment}
        onInputValueChange={handleInputValueChange}
        onOptionSelect={handleOptionSelect}
        renderOptionContent={renderOptionContent}
        actionButtonLabel={hasActionButton ? actionButtonLabel : undefined}
        onActionButtonClick={hasActionButton ? handleActionButtonClick : undefined}
      />
      {showInlineCreate && renderInlineCreate && (
        <InlineCreateSection
          formik={formik}
          name={name}
          renderInlineCreate={renderInlineCreate}
          onRefetch={refetchOptions}
          onClose={handleCancel}
        />
      )}
    </Box>
  );
};
