// ---------------------------------------------------------------------------
// ConfirmReSignDialog — mid-signing edit confirmation.
//
// When the carrier attempts to save a change to one of the 3 identity fields
// (legalName / mcNumber / dotNumber) AND at least one agreement is already
// SIGNED, this dialog warns them that confirming will VOID the signed
// agreement(s) and require re-signing before they can complete onboarding.
//
// Confirm  → caller's onConfirm fires (typically dispatches voidAndReSign saga
//            which voids all impacted agreements, persists the field change,
//            and navigates back to /sign-agreement).
// Cancel   → caller's onCancel fires (typically reverts the form and closes).
// ---------------------------------------------------------------------------

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import { format, parseISO } from 'date-fns';

import { Body, BodyStrong } from 'components/Typography';
import type { AgreementContext, IdentityField } from 'features/carrier-portal/engine';

const IDENTITY_FIELD_LABELS: Record<IdentityField, string> = {
  legalName: 'legal name',
  mcNumber: 'MC number',
  dotNumber: 'DOT number',
};

export interface ConfirmReSignDialogProps {
  open: boolean;
  changedFields: IdentityField[];
  affectedAgreements: AgreementContext[];
  onCancel: () => void;
  onConfirm: () => void;
}

const formatSignedAt = (signedAt: string | null | undefined): string => {
  if (!signedAt) return '';
  try {
    return format(parseISO(signedAt), 'PPpp');
  } catch {
    return signedAt;
  }
};

const renderFieldList = (fields: IdentityField[]): string => {
  const labels = fields.map((f) => IDENTITY_FIELD_LABELS[f]);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
};

const ConfirmReSignDialog: React.FC<ConfirmReSignDialogProps> = ({
  open,
  changedFields,
  affectedAgreements,
  onCancel,
  onConfirm,
}) => {
  const fieldList = renderFieldList(changedFields);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="resign-dialog-title"
    >
      <DialogTitle id="resign-dialog-title">Re-sign required</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Body>
            Changing your <strong>{fieldList}</strong> will void the agreement
            {affectedAgreements.length === 1 ? '' : 's'} you've already signed.
            You'll need to re-sign before you can complete onboarding.
          </Body>
          {affectedAgreements.length > 0 ? (
            <Stack
              component="ul"
              spacing={0.5}
              sx={{ pl: 2, m: 0, listStyleType: 'disc' }}
            >
              {affectedAgreements.map((a) => (
                <li key={a.id}>
                  <BodyStrong sx={{ fontSize: 13 }}>
                    {a.templateKey === 'DISPATCH_AGREEMENT'
                      ? 'Dispatch Services Agreement'
                      : a.templateKey}
                  </BodyStrong>
                  {a.signedAt ? (
                    <Body sx={{ fontSize: 12, color: 'text.secondary' }}>
                      signed {formatSignedAt(a.signedAt)}
                    </Body>
                  ) : null}
                </li>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary" autoFocus>
          Continue and re-sign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmReSignDialog;
