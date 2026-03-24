import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { EditDrawer, DrawerSection as DrawerSectionGroup } from 'components/EditDrawer';

const DrawerSectionDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Edit Drawer (navy header)
      </Typography>
      <Box>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          Open Edit Drawer
        </Button>
      </Box>
      <EditDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Company Info"
        subtitle="Swift Transport LLC"
        isDirty={false}
        footer={
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button variant="text" color="error" onClick={() => setOpen(false)}>
              Discard
            </Button>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={() => setOpen(false)}>
              Save Changes
            </Button>
          </Stack>
        }
      >
        <Stack spacing={3} sx={{ p: 3 }}>
          <DrawerSectionGroup label="Broker Information">
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Form fields would go here (TextField, SelectField, etc.)
              </Typography>
            </Box>
          </DrawerSectionGroup>

          <DrawerSectionGroup label="Financial Details">
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                More form fields in this section
              </Typography>
            </Box>
          </DrawerSectionGroup>
        </Stack>
      </EditDrawer>
    </Stack>
  );
};

export default DrawerSectionDemo;
