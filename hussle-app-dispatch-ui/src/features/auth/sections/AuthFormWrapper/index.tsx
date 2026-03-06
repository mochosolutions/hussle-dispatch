import React, {ReactNode} from 'react';
import {Grid, Stack, Typography, Alert, AlertTitle} from '@mui/material';
import {Link} from 'react-router-dom';

interface ActionLinkProps {
  label: string;
  to: string;
}

interface AuthFormWrapperProps {
  title: string;
  subTitle?: string;
  error?: boolean;
  errorTitle?: string;
  actionLink?: ActionLinkProps;
  children: ReactNode;
}

const AuthFormWrapper: React.FC<AuthFormWrapperProps> = ({
  title,
  subTitle,
  error,
  errorTitle,
  actionLink,
  children,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      {error && (
        <Alert color="error" variant="border" sx={{mt: 1.5, mb: 1.5}}>
          {errorTitle && <AlertTitle>{errorTitle}</AlertTitle>}
          {error}
        </Alert>
      )}

      <Stack direction="column" spacing={1} marginTop={2} >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Typography variant="h3">{title}</Typography>
          {actionLink && (
            <Typography
              component={Link}
              to={actionLink.to}
              variant="body1"
              sx={{textDecoration: 'none'}}
              color="primary"
            >
              {actionLink.label}
            </Typography>
          )}
        </Stack>
        {subTitle && (
          <Typography variant="body1" color="secondary">
            {subTitle}
          </Typography>
        )}
      </Stack>
    </Grid>
    <Grid item xs={12}>
      {children}
    </Grid>
  </Grid>
);

export default AuthFormWrapper;
