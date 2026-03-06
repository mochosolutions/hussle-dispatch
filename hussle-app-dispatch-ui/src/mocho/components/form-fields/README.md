# Form Fields Component Library

A collection of reusable form components designed for authentication forms and general form handling in the Mocho Solutions Admin UI. All components integrate seamlessly with Formik and Material-UI.

## Installation

Components are already part of the admin UI. Import from `components/form-fields`:

```typescript
import {
  EmailField,
  PasswordField,
  TextField,
  SelectField,
  CheckboxField,
  SubmitButton,
  FormLink,
} from 'components/form-fields';
```

## Components Overview

### Input Components

| Component | Description |
|-----------|-------------|
| `EmailField` | Email input with validation styling |
| `TextField` | Basic text input field |
| `PasswordField` | Password input with visibility toggle |
| `PasswordFieldWithStrength` | Password with strength meter |
| `PasswordFieldWithChecklist` | Password with validation checklist |
| `ConfirmPasswordField` | Password confirmation field |
| `SelectField` | Dropdown select field |
| `CheckboxField` | Checkbox with label |
| `OTPField` | One-time password input (6-digit default) |

### Button Components

| Component | Description |
|-----------|-------------|
| `SubmitButton` | Primary form submission button |
| `SecondaryButton` | Secondary action button |

### Navigation Components

| Component | Description |
|-----------|-------------|
| `FormLink` | Styled link using React Router |
| `TermsNotice` | Terms and privacy policy notice with links |

### Helper Components

| Component | Description |
|-----------|-------------|
| `FormError` | Form-level error display |
| `HelperText` | Helper text below form fields |
| `BaseFieldWrapper` | Base wrapper for consistent field layout |

## Usage Examples

### Basic Form with Formik

```typescript
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  EmailField,
  PasswordField,
  SubmitButton,
  FormLink,
} from 'components/form-fields';

const LoginForm = () => {
  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <EmailField
        name="email"
        label="Email Address"
        placeholder="Enter email"
        required
        formik={formik}
      />
      <PasswordField
        name="password"
        label="Password"
        placeholder="Enter password"
        required
        enableToggle
        formik={formik}
      />
      <SubmitButton isSubmitting={formik.isSubmitting}>
        Sign In
      </SubmitButton>
      <FormLink to="/forgot-password">Forgot password?</FormLink>
    </form>
  );
};
```

### Password with Strength Meter

```typescript
<PasswordFieldWithStrength
  name="password"
  label="New Password"
  placeholder="Enter password"
  required
  enableToggle
  showStrengthMeter
  formik={formik}
/>
```

### Password with Validation Checklist

```typescript
<PasswordFieldWithChecklist
  name="password"
  label="Create Password"
  required
  enableToggle
  validationRules={[
    { test: (v) => v.length >= 8, label: 'At least 8 characters' },
    { test: (v) => /[A-Z]/.test(v), label: 'One uppercase letter' },
    { test: (v) => /[a-z]/.test(v), label: 'One lowercase letter' },
    { test: (v) => /[0-9]/.test(v), label: 'One number' },
  ]}
  formik={formik}
/>
```

### Select Field

```typescript
const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
];

<SelectField
  name="country"
  label="Country"
  data={countries}
  required
  formik={formik}
/>
```

### OTP Field

```typescript
<OTPField
  name="otp"
  label="Verification Code"
  numDigits={6}
  formik={formik}
/>
```

### Checkbox Field

```typescript
<CheckboxField
  name="rememberMe"
  label="Remember me"
  formik={formik}
/>
```

### Terms Notice

```typescript
<TermsNotice
  termsUrl="/terms"
  privacyUrl="/privacy"
/>
```

## Integration with DynamicForm

The components integrate with the existing DynamicForm system. Use the following field types:

```typescript
import DynamicForm from 'components/DynamicForm';
import type { FormStructure } from 'components/DynamicForm/types';

const formStructure: FormStructure = {
  fields: [
    { type: 'email', name: 'email', label: 'Email' },
    { type: 'password', name: 'password', label: 'Password', enableToggle: true },
    { type: 'passwordWithStrength', name: 'newPassword', label: 'New Password' },
    { type: 'passwordWithChecklist', name: 'password', label: 'Password', validationRules: [...] },
    { type: 'confirmPassword', name: 'confirmPassword', label: 'Confirm Password' },
    { type: 'otp', name: 'code', label: 'Verification Code', numDigits: 6 },
    { type: 'checkbox', name: 'terms', label: 'I accept the terms' },
  ],
};
```

## API Reference

### FormikFieldProps

All input components accept a `formik` prop with this interface:

```typescript
interface FormikFieldProps<T = Record<string, unknown>> {
  values: T;
  errors: FormikErrors<T>;
  touched: FormikTouched<T>;
  handleChange: (e: ChangeEvent) => void;
  handleBlur: (e: FocusEvent) => void;
  setFieldValue: (field: string, value: unknown) => void;
}
```

### Common Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name (matches Formik values key) |
| `label` | `string` | Label text displayed above field |
| `placeholder` | `string` | Placeholder text |
| `required` | `boolean` | Show required indicator |
| `formik` | `FormikFieldProps` | Formik form state and handlers |

### PasswordField Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableToggle` | `boolean` | `true` | Show password visibility toggle |

### PasswordFieldWithStrength Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableToggle` | `boolean` | `true` | Show password visibility toggle |
| `showStrengthMeter` | `boolean` | `true` | Show strength progress bar |

### PasswordFieldWithChecklist Props

| Prop | Type | Description |
|------|------|-------------|
| `enableToggle` | `boolean` | Show password visibility toggle |
| `validationRules` | `ValidationRule[]` | Array of validation rules with test and label |

### SelectField Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `SelectOption[]` | Array of `{ value, label }` options |

### OTPField Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `numDigits` | `number` | `6` | Number of OTP digits |

### CheckboxField Props

| Prop | Type | Description |
|------|------|-------------|
| `color` | `'primary' \| 'secondary'` | Checkbox color |

### SubmitButton Props

| Prop | Type | Description |
|------|------|-------------|
| `isSubmitting` | `boolean` | Show loading state |
| `fullWidth` | `boolean` | Expand to full width |

### FormLink Props

| Prop | Type | Description |
|------|------|-------------|
| `to` | `string` | React Router link destination |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |

### TermsNotice Props

| Prop | Type | Description |
|------|------|-------------|
| `termsUrl` | `string` | URL to terms page |
| `privacyUrl` | `string` | URL to privacy policy page |

## Testing

All components have comprehensive test coverage:

```bash
npm test -- --testPathPattern="form-fields"
```

Test files are colocated with their components in each directory.

## Architecture

Each component has its own directory with an `index.tsx` file and colocated test file:

```
form-fields/
├── BaseFieldWrapper/
│   ├── index.tsx
│   └── BaseFieldWrapper.test.tsx
├── EmailField/
│   ├── index.tsx
│   └── EmailField.test.tsx
├── TextField/
│   ├── index.tsx
│   └── TextField.test.tsx
├── PasswordField/
│   ├── index.tsx
│   └── PasswordField.test.tsx
├── PasswordFieldWithStrength/
│   ├── index.tsx
│   └── PasswordFieldWithStrength.test.tsx
├── PasswordFieldWithChecklist/
│   ├── index.tsx
│   └── PasswordFieldWithChecklist.test.tsx
├── ConfirmPasswordField/
│   ├── index.tsx
│   └── ConfirmPasswordField.test.tsx
├── SelectField/
│   ├── index.tsx
│   └── SelectField.test.tsx
├── CheckboxField/
│   ├── index.tsx
│   └── CheckboxField.test.tsx
├── OTPField/
│   ├── index.tsx
│   └── OTPField.test.tsx
├── SubmitButton/
│   ├── index.tsx
│   └── SubmitButton.test.tsx
├── SecondaryButton/
│   ├── index.tsx
│   └── SecondaryButton.test.tsx
├── FormLink/
│   ├── index.tsx
│   └── FormLink.test.tsx
├── TermsNotice/
│   ├── index.tsx
│   └── TermsNotice.test.tsx
├── FormError/
│   ├── index.tsx
│   └── FormError.test.tsx
├── HelperText/
│   ├── index.tsx
│   └── HelperText.test.tsx
├── types.ts             # TypeScript interfaces
└── index.ts             # Public exports
```

## Design Principles

1. **Consistency**: All fields use `BaseFieldWrapper` for uniform label/error layout
2. **Accessibility**: Proper ARIA attributes and label associations
3. **Flexibility**: Works with manual Formik forms and DynamicForm
4. **Testability**: Components designed for easy testing with mocked Formik props
5. **Type Safety**: Full TypeScript coverage with strict typing
