import { useState } from 'react';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { EditDrawer, DrawerSection } from 'components/EditDrawer';

const EditDrawerDemo = () => {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Edit Drawer Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Standalone page demonstrating the EditDrawer with navy header, DrawerSection groups, and
        footer buttons. Toggle the dirty flag to test the confirmation dialog.
      </Typography>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Edit Drawer
        </Button>
        <Button
          variant="outlined"
          color={dirty ? 'warning' : 'inherit'}
          onClick={() => setDirty(!dirty)}
        >
          {dirty ? 'Dirty: ON' : 'Dirty: OFF'}
        </Button>
      </Stack>

      <EditDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Carrier Profile"
        subtitle="Swift Transport LLC"
        isDirty={dirty}
        footer={
          <Stack direction="row" justifyContent="space-between">
            <Button variant="text" color="error" onClick={() => setOpen(false)}>
              Discard
            </Button>
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDirty(false);
                  setOpen(false);
                }}
              >
                Save Changes
              </Button>
            </Stack>
          </Stack>
        }
      >
        <Stack spacing={3} sx={{ p: 3 }}>
          <DrawerSection label="Broker Information">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box
                  sx={{
                    height: 40,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Company Name field
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    height: 40,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    MC Number
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    height: 40,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    DOT Number
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{
                    height: 40,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Email Address
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DrawerSection>

          <DrawerSection label="Financial Details">
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    height: 40,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Pay Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    height: 40,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Payment Terms
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DrawerSection>
        </Stack>
      </EditDrawer>
    </Box>
  );
};

export default EditDrawerDemo;
