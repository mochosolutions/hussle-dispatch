import React from 'react';
import {Stepper, Step, StepLabel} from '@mui/material';
import {Formik, Form} from 'formik';

interface StepperFormProps {
  steps: string[];
  initialValues: any;
  validationSchemas: any[];
  renderStepContent: (
    step: number,
    formikProps: any,
    additionalProps?: any,
  ) => React.ReactNode; // Updated to allow passing additionalProps
  onSubmit: (values: any, actions: any) => Promise<void>;
  additionalProps?: any; // Add optional additional props
  onBack?: () => void;
  formId?: string;
  activeStep: number; // Add optional additionalProps here
}

const StepperForm: React.FC<StepperFormProps> = ({
  steps,
  initialValues,
  validationSchemas,
  renderStepContent,
  onSubmit,
  onBack,
  formId,
  additionalProps,
  activeStep, // Add optional additionalProps here
}) => {
  // const [activeStep, setActiveStep] = useState(0);
  const currentValidationSchema = validationSchemas[activeStep];
  // const isLastStep = activeStep === steps.length - 1;

  const handleSubmit = async (values: any, actions: any) => {
    console.log('Submitting form', values);
    // if (isLastStep) {
    //   await onSubmit(values, actions);
    // } else {
    //   setActiveStep(activeStep + 1);
    //   actions.setTouched({});
    //   actions.setSubmitting(false);
    // }
  };

  // const handleBack = () => {
  //   setActiveStep(activeStep - 1);
  //   if (onBack) onBack();
  // };

  console.log('StepperForm additionalProps', additionalProps); // Log additionalProps

  return (
    <>
      <Stepper activeStep={activeStep} sx={{marginBottom: 2}}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Formik
        initialValues={initialValues}
        validationSchema={currentValidationSchema}
        onSubmit={handleSubmit}
      >
        {(formikProps) => (
          <Form id={formId}>
            {renderStepContent(
              activeStep,
              formikProps,
              (additionalProps = {...additionalProps}),
            )}
            {/* <Grid container spacing={2} sx={{ marginTop: 2 }}>
              <Grid item xs={6}>
                {activeStep !== 0 && (
                  <Button onClick={handleBack}>Back</Button>
                )}
              </Grid>

              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  {isLastStep ? 'Submit' : 'Next'}
                </Button>
                {formikProps.isSubmitting && (
                  <CircularProgress size={24} sx={{ marginLeft: 2 }} />
                )}
              </Grid>
            </Grid> */}
          </Form>
        )}
      </Formik>
    </>
  );
};

export default StepperForm;
