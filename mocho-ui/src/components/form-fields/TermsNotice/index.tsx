import React from 'react';
import { Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { TermsNoticeProps } from '../types';

/**
 * TermsNotice - Terms and privacy policy notice component.
 *
 * Features:
 * - Customizable intro text
 * - Terms of Service link
 * - Privacy Policy link
 * - RouterLink integration
 */
export const TermsNotice: React.FC<TermsNoticeProps> = ({
  termsLink,
  privacyLink,
  customText = 'By Signing up, you agree to our',
}) => {
  return (
    <Typography variant="body2">
      {customText} &nbsp;
      <Link variant="subtitle2" component={RouterLink} to={termsLink}>
        Terms of Service
      </Link>
      &nbsp; and &nbsp;
      <Link variant="subtitle2" component={RouterLink} to={privacyLink}>
        Privacy Policy
      </Link>
    </Typography>
  );
};
