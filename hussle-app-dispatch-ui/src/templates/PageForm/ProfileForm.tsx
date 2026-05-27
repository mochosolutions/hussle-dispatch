import { Stack, TextField } from '@mui/material';

export interface ProfileFormValues {
  name: string;
  email: string;
  bio: string;
}

interface ProfileFormProps {
  values: ProfileFormValues;
  errors: Partial<ProfileFormValues>;
  touched: Partial<Record<keyof ProfileFormValues, boolean>>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
}

// Pure presentational — no Formik, no hooks, fully reusable
export function ProfileForm({ values, errors, touched, onChange, onBlur }: ProfileFormProps) {
  return (
    <Stack spacing={3}>
      <TextField
        name="name"
        label="Name"
        value={values.name}
        error={touched.name && Boolean(errors.name)}
        helperText={touched.name && errors.name}
        onChange={onChange}
        onBlur={onBlur}
      />
      <TextField
        name="email"
        label="Email"
        value={values.email}
        error={touched.email && Boolean(errors.email)}
        helperText={touched.email && errors.email}
        onChange={onChange}
        onBlur={onBlur}
      />
      <TextField
        name="bio"
        label="Bio"
        multiline
        rows={4}
        value={values.bio}
        error={touched.bio && Boolean(errors.bio)}
        helperText={touched.bio && errors.bio}
        onChange={onChange}
        onBlur={onBlur}
      />
    </Stack>
  );
}