import React, {
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useFormik } from 'formik';
import {
  Grid,
  Button,
  Stack,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import MainCard from '../MainCard';
import { ReadOnlyFieldDisplay } from './ReadOnlyFieldDisplay';
import type {
  EditableSectionProps,
  EditableSectionHandle,
  EditableSectionMode,
  EditableSectionField,
} from './types';

/**
 * EditableSection - Enterprise-ready inline editing component
 *
 * Features:
 * - Toggle between view and edit modes
 * - Mix of editable and read-only fields in same section
 * - Independent form per section (atomic saves)
 * - Permission control via canEdit prop
 * - Formik validation
 * - Generic TypeScript support
 */
function EditableSectionInner<T extends object>(
  props: EditableSectionProps<T>,
  ref: React.ForwardedRef<EditableSectionHandle>,
) {
  const {
    title,
    fields,
    data,
    onSave,
    validationSchema,
    canEdit = true,
    loading = false,
    className,
  } = props;

  const [mode, setMode] = useState<EditableSectionMode>('view');

  // Cast data to allow indexing
  const dataRecord = data as Record<string, unknown>;

  // Build initial values from data, only including editable fields
  const initialValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.editable !== false) {
        values[field.name] = dataRecord[field.name] ?? '';
      }
    });
    return values as Partial<T>;
  }, [fields, dataRecord]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await onSave(values as Partial<T>);
      setMode('view');
    },
  });

  const handleEnterEditMode = useCallback(() => {
    formik.resetForm({ values: initialValues });
    setMode('edit');
  }, [formik, initialValues]);

  const handleExitEditMode = useCallback(() => {
    formik.resetForm({ values: initialValues });
    setMode('view');
  }, [formik, initialValues]);

  const handleSave = useCallback(async () => {
    await formik.submitForm();
  }, [formik]);

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      enterEditMode: handleEnterEditMode,
      exitEditMode: handleExitEditMode,
      save: handleSave,
      mode,
      isDirty: formik.dirty,
    }),
    [handleEnterEditMode, handleExitEditMode, handleSave, mode, formik.dirty],
  );

  // Render a single field based on mode
  const renderField = (field: EditableSectionField) => {
    const { name, label, type, editable = true, gridSize = 6, options, format, placeholder, rows = 3 } = field;
    const value = dataRecord[name];

    // In view mode OR for non-editable fields, show read-only display
    if (mode === 'view' || !editable) {
      return (
        <Grid item xs={12} sm={gridSize} key={name}>
          <ReadOnlyFieldDisplay
            label={label}
            value={value}
            format={format}
          />
        </Grid>
      );
    }

    // In edit mode for editable fields, show form input
    // Field names come from the fields config and are valid keys of T,
    // but TypeScript cannot narrow string to keyof Partial<T> here.
    const touched = formik.touched as Record<string, boolean | undefined>;
    const errors = formik.errors as Record<string, string | undefined>;
    const values = formik.values as Record<string, unknown>;
    const fieldError = touched[name] && errors[name];

    let inputType = 'text';
    if (type === 'email') {
      inputType = 'email';
    } else if (type === 'number') {
      inputType = 'number';
    }

    let fieldContent: React.ReactNode;
    if (type === 'select') {
      fieldContent = (
        <TextField
          select
          fullWidth
          id={name}
          name={name}
          label={label}
          value={values[name] ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(fieldError)}
          helperText={fieldError as string}
          size="small"
        >
          {options?.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    } else if (type === 'textarea') {
      fieldContent = (
        <TextField
          fullWidth
          multiline
          rows={rows}
          id={name}
          name={name}
          label={label}
          placeholder={placeholder}
          value={values[name] ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(fieldError)}
          helperText={fieldError as string}
          size="small"
        />
      );
    } else {
      fieldContent = (
        <TextField
          fullWidth
          id={name}
          name={name}
          label={label}
          type={inputType}
          placeholder={placeholder}
          value={values[name] ?? ''}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(fieldError)}
          helperText={fieldError as string}
          size="small"
        />
      );
    }

    return (
      <Grid item xs={12} sm={gridSize} key={name}>
        {fieldContent}
      </Grid>
    );
  };

  // Header action buttons
  const headerActions = () => {
    if (!canEdit) return null;

    if (mode === 'view') {
      return (
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={handleEnterEditMode}
        >
          Edit
        </Button>
      );
    }

    return (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          color="secondary"
          startIcon={<CancelIcon />}
          onClick={handleExitEditMode}
          disabled={formik.isSubmitting}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={formik.isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={formik.isSubmitting || !formik.dirty}
        >
          {formik.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    );
  };

  if (loading) {
    return (
      <MainCard title={title} className={className}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={title}
      secondary={headerActions()}
      className={className}
    >
      <Box component={mode === 'edit' ? 'form' : 'div'} onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {fields.map(renderField)}
        </Grid>
      </Box>
    </MainCard>
  );
}

// Wrap with forwardRef while preserving generic type
export const EditableSection = forwardRef(EditableSectionInner) as <
  T extends object,
>(
  props: EditableSectionProps<T> & { ref?: React.Ref<EditableSectionHandle> },
) => React.ReactElement;

export default EditableSection;

// Re-export types
export * from './types';
export { ReadOnlyFieldDisplay } from './ReadOnlyFieldDisplay';
