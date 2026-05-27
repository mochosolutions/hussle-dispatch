import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface ContextualAlertAction {
  label: string;
  onClick: () => void;
}

interface ContextualAlertProps {
  severity: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  action?: ContextualAlertAction;
  onDismiss?: () => void;
  sx?: SxProps<Theme>;
}

export const ContextualAlert: React.FC<ContextualAlertProps> = ({
  severity,
  title,
  description,
  action,
  onDismiss,
  sx,
}) => (
  <Alert
    severity={severity}
    onClose={onDismiss}
    sx={{ px: 3, py: 1.5, borderRadius: 0, borderLeft: '4px solid', borderLeftColor: `${severity}.main`, ...sx }}
    action={
      action ? (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <Button
            variant="contained"
            size="small"
            color={severity}
            onClick={action.onClick}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {action.label}
          </Button>
        </Stack>
      ) : undefined
    }
  >
    <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>
    {description}
  </Alert>
);
