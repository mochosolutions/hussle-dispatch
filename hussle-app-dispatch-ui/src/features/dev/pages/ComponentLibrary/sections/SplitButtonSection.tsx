import { useState } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';

import { SplitButton } from 'components/SplitButton';

const SplitButtonSection = () => {
  const [lastAction, setLastAction] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const log = (label: string) => () => setLastAction(label);

  const simulateBusy = (label: string) => () => {
    setLastAction(label);
    setBusy(true);
    window.setTimeout(() => setBusy(false), 1500);
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Split mode — selection persists
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use when one action is the obvious default and the dropdown holds variants of the same
          submission. Click the chevron to change the primary action.
        </Typography>
        <SplitButton
          variant="split"
          ariaLabel="create load actions"
          defaultKey="booked"
          busy={busy}
          items={[
            {
              key: 'booked',
              label: 'Create as Booked',
              busyLabel: 'Creating...',
              onClick: simulateBusy('Create as Booked'),
            },
            {
              key: 'draft',
              label: 'Save as Draft',
              busyLabel: 'Saving...',
              onClick: simulateBusy('Save as Draft'),
            },
            {
              key: 'template',
              label: 'Save as Template',
              busyLabel: 'Saving...',
              onClick: simulateBusy('Save as Template'),
            },
          ]}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Action mode — fixed primary + chevron menu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use when there&apos;s a clear primary action and a few related alternates that should NOT
          replace it. Selecting a dropdown item just fires its handler — primary stays put. Example:
          a status-change button where Exception/TONU live behind the chevron but &quot;Mark
          Dispatched&quot; remains the default action.
        </Typography>
        <SplitButton
          variant="action"
          ariaLabel="status change"
          primary={{
            key: 'next-status',
            label: 'Mark Dispatched',
            onClick: log('Mark Dispatched'),
          }}
          items={[
            { key: 'exception', label: 'Exception', onClick: log('Exception') },
            { key: 'tonu', label: 'Truck Ordered Not Used', onClick: log('TONU') },
          ]}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Menu mode — single &quot;Actions&quot; trigger
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use to collapse multiple page-level actions into one dropdown. Supports icons, dividers,
          danger styling, and disabled-with-reason tooltips. Each action is independent — no primary
          selection.
        </Typography>
        <SplitButton
          variant="menu"
          triggerLabel="Actions"
          ariaLabel="load actions"
          items={[
            {
              key: 'mark-dispatched',
              label: 'Mark Dispatched',
              onClick: log('Mark Dispatched'),
              dividerAfter: true,
            },
            {
              key: 'check-call',
              label: 'Check Call',
              icon: <PhoneInTalkIcon fontSize="small" />,
              onClick: log('Check Call'),
            },
            {
              key: 'send-sms',
              label: 'Send Check-in SMS',
              icon: <SmsOutlinedIcon fontSize="small" />,
              onClick: log('Send Check-in SMS'),
              dividerAfter: true,
            },
            {
              key: 'invoice',
              label: 'Send Invoice',
              icon: <ReceiptLongIcon fontSize="small" />,
              onClick: log('Send Invoice'),
              disabled: true,
              disabledReason:
                'Required documents (Rate Con, signed BOL, POD) must be confirmed before sending.',
            },
            {
              key: 'copy-portal',
              label: 'Copy Driver Portal Link',
              icon: <ContentCopyIcon fontSize="small" />,
              onClick: log('Copy Driver Portal Link'),
              dividerAfter: true,
            },
            {
              key: 'delete',
              label: 'Delete Load',
              icon: <DeleteOutlineIcon fontSize="small" />,
              onClick: log('Delete Load'),
              danger: true,
            },
          ]}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Menu mode — icon trigger (compact)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use in tight spaces — toolbars, table rows, or alongside summary bars. Defaults to the
          kebab (MoreVert) icon when no <code>triggerIcon</code> is provided.
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <SplitButton
            variant="menu"
            triggerVariant="icon"
            ariaLabel="row actions"
            items={[
              {
                key: 'edit',
                label: 'Edit',
                icon: <EditIcon fontSize="small" />,
                onClick: log('Edit'),
              },
              {
                key: 'duplicate',
                label: 'Duplicate',
                icon: <ContentCopyIcon fontSize="small" />,
                onClick: log('Duplicate'),
                dividerAfter: true,
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlineIcon fontSize="small" />,
                onClick: log('Delete'),
                danger: true,
              },
            ]}
          />
          <Typography variant="body2" color="text.secondary">
            kebab trigger →
          </Typography>
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Menu mode — outlined variant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Same component, lower visual weight. Use as a secondary action group on detail pages.
        </Typography>
        <SplitButton
          variant="menu"
          buttonVariant="outlined"
          triggerLabel="More"
          ariaLabel="more actions"
          items={[
            { key: 'export-pdf', label: 'Export as PDF', onClick: log('Export PDF') },
            { key: 'export-csv', label: 'Export as CSV', onClick: log('Export CSV') },
            { key: 'print', label: 'Print', onClick: log('Print') },
          ]}
        />
      </Box>

      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Last action triggered: <strong>{lastAction || '(none)'}</strong>
        </Typography>
      </Box>
    </Stack>
  );
};

export default SplitButtonSection;
