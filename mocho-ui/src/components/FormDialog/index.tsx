import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Formik, Form } from 'formik';
import AnimateButton from '../extended/AnimateButton';
import {LoadingButton} from '@mui/lab';
import DynamicForm from '../DynamicForm';
import { FormStructure } from '../DynamicForm/types';

// ==============================|| FORM DIALOG - TYPES ||============================== //

interface FormDialogProps<T> {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when dialog closes */
  onClose?: () => void;

  /** Callback when form is submitted */
  onSubmit: (values: T) => void;

  /** Yup validation schema */
  validationSchema: any;

  /** Initial form values */
  initialValues: any;

  /** Form field structure configuration */
  structure: FormStructure;

  /** Submit button text */
  actionTitle: string;

  /** Dialog title */
  dialogTitle: string;

  /** Whether form is submitting */
  isLoading?: boolean;
}

// ==============================|| FORM DIALOG ||============================== //

const FormDialog: React.FC<FormDialogProps<any>> = ({
  open,
  onClose,
  onSubmit,
  structure,
  actionTitle,
  dialogTitle,
  isLoading = false,
  validationSchema = {},
  initialValues = {},
}) => {
  const handleClose = (event: React.SyntheticEvent, reason: string) => {
    // Prevent closing during submission via backdrop or escape key
    if (isLoading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }

    // Call onClose callback if provided
    if (onClose) {
      onClose();
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {formikProps => (
          <Form noValidate>
            <DialogTitle id="form-dialog-title">
              {dialogTitle}
            </DialogTitle>

            <DialogContent dividers>
              <DynamicForm
                structure={structure}
                values={formikProps.values}
                touched={formikProps.touched as Partial<Record<string, boolean>>}
                errors={formikProps.errors as Partial<Record<string, string>>}
                handleChange={formikProps.handleChange}
                handleBlur={formikProps.handleBlur}
                setFieldValue={formikProps.setFieldValue as any}
              />
            </DialogContent>

            <DialogActions>
              <Button
                onClick={(event) => handleClose(event, 'buttonClick')}
                variant="contained"
                color="inherit"
                disabled={isLoading}
              >
                Cancel
              </Button>

              <AnimateButton>
                <LoadingButton
                  loading={isLoading}
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  {actionTitle}
                </LoadingButton>
              </AnimateButton>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default FormDialog;
