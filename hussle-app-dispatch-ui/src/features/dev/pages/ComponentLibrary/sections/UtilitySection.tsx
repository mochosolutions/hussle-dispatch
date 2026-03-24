import { useState } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { AvatarChip } from 'components/AvatarChip';
import { ActionMenu } from 'components/ActionMenu';
import { FileUploadRow } from 'components/FileUploadRow';
import ConfirmDialog from '../../../../../mocho/components/ConfirmDialog';

const noop = () => {
  // placeholder for demo callbacks
};

const UtilitySection = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mockFile = new File(['hello'], 'rate_confirmation.pdf', {
    type: 'application/pdf',
  });

  return (
    <Stack spacing={4}>
      {/* AvatarChip */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          AvatarChip
        </Typography>
        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          <AvatarChip name="John Rodriguez" />
          <AvatarChip name="Maria Santos" />
          <AvatarChip name="Alex" />
          <AvatarChip name="John Rodriguez" size="small" />
          <AvatarChip name="Maria Santos" size="small" />
        </Stack>
      </Box>

      <Divider />

      {/* ActionMenu */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          ActionMenu
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Click the kebab menu:
          </Typography>
          <ActionMenu
            items={[
              { label: 'Edit', onClick: noop, icon: <EditIcon fontSize="small" /> },
              { label: 'Duplicate', onClick: noop, icon: <ContentCopyIcon fontSize="small" /> },
              {
                label: 'Delete',
                onClick: noop,
                icon: <DeleteIcon fontSize="small" />,
                danger: true,
              },
              { label: 'Disabled option', onClick: noop, disabled: true },
            ]}
          />
        </Stack>
      </Box>

      <Divider />

      {/* FileUploadRow */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          FileUploadRow — all states
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <FileUploadRow label="Rate Confirmation" required status="idle" onUpload={noop} onRemove={noop} />
          <FileUploadRow
            label="Bill of Lading"
            file={mockFile}
            status="uploading"
            onUpload={noop}
            onRemove={noop}
          />
          <FileUploadRow
            label="Proof of Delivery"
            file={mockFile}
            status="done"
            onUpload={noop}
            onRemove={noop}
          />
          <FileUploadRow
            label="Lumper Receipt"
            file={mockFile}
            status="error"
            onUpload={noop}
            onRemove={noop}
          />
        </Box>
      </Box>

      <Divider />

      {/* ConfirmDialog */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          ConfirmDialog
        </Typography>
        <Button variant="outlined" color="error" size="small" onClick={() => setConfirmOpen(true)}>
          Trigger Confirm Dialog
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          title="Delete this load?"
          content="This action cannot be undone. All associated documents and invoices will be permanently removed."
          confirmText="Delete"
          cancelText="Cancel"
          severity="error"
          onConfirm={() => setConfirmOpen(false)}
          onClose={() => setConfirmOpen(false)}
        />
      </Box>
    </Stack>
  );
};

export default UtilitySection;
