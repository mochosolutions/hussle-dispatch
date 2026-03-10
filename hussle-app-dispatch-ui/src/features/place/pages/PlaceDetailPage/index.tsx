import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Grid,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { InnerPageHeader } from '../../../../components/InnerPageHeader';
import { selectFormattedPlaceById } from '../../store/selectors/placeSelectors';
import {
  fetchPlaceDetailsRequest,
  deletePlaceRequest,
} from '../../store/reducers/placePageSlice';
import { placePageSelectors } from '../../store/reducers/placePageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import { FACILITY_TYPE_LABELS, DOCK_TYPE_LABELS } from '../../constants';
import type { FacilityType, DockType } from '../../types';

const FieldRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', py: 1 }}>
    <Typography variant="body2" sx={{ color: 'text.disabled', width: 140, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
      {value || '\u2014'}
    </Typography>
  </Box>
);

const SectionHeader: React.FC<{ title: string; onEdit?: () => void }> = ({ title, onEdit }) => (
  <Box
    sx={{
      px: 3,
      py: 2,
      borderBottom: 1,
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Typography
      variant="subtitle1"
      sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
    >
      {title}
    </Typography>
    {onEdit && (
      <Tooltip title="Edit">
        <IconButton size="small" onClick={onEdit} aria-label={`Edit ${title}`}>
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

const PlaceDetailPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { id } = useParams();
  const place = useSelector(selectFormattedPlaceById(id));
  const isLoading = useSelector(placePageSelectors.selectIsEntityLoading('getById', id ?? ''));
  const isError = useSelector(
    (state) => Boolean(placePageSelectors.selectEntityError('getById', id ?? '')(state)),
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchPlaceDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = () => {
    navigate('/places');
  };

  const handleEdit = () => {
    if (id) {
      openDrawer('placeInfo', { placeId: id });
    }
  };

  const handleDelete = () => {
    if (id) {
      dispatch(deletePlaceRequest({ id }));
      navigate('/places');
    }
  };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="PlaceDetailPage">
      <DataGuard data={place} emptyComponent={<Typography p={4}>Place not found.</Typography>}>
        {(p) => (
          <>
            <Box
              sx={{
                px: 4,
                pt: 2,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <InnerPageHeader
                onBack={handleBack}
                backLabel="Places"
                title={
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {p.name}
                    </Typography>
                    {p.facilityType && (
                      <Chip
                        label={FACILITY_TYPE_LABELS[p.facilityType as FacilityType]}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                }
                actions={
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                      size="small"
                    >
                      Delete
                    </Button>
                  </Stack>
                }
              />
            </Box>

            <Box sx={{ p: 3, maxWidth: 1200 }}>
              <Stack spacing={2.5}>
                {/* Location Card */}
                <Card>
                  <SectionHeader title="Location" onEdit={handleEdit} />
                  <Box sx={{ px: 3, py: 2 }}>
                    <Grid container>
                      <Grid item xs={6}>
                        <FieldRow label="Name" value={p.name} />
                        <FieldRow label="Address" value={p.address} />
                        {p.address2 && <FieldRow label="Address 2" value={p.address2} />}
                        <FieldRow
                          label="City / State / ZIP"
                          value={[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FieldRow
                          label="Coordinates"
                          value={
                            p.latitude !== null && p.longitude !== null
                              ? `${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`
                              : null
                          }
                        />
                        {p.geoSource && (
                          <FieldRow
                            label="Geo Source"
                            value={
                              <Chip
                                label={p.geoSource}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.625rem' }}
                              />
                            }
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Card>

                {/* Facility Details Card */}
                <Card>
                  <SectionHeader title="Facility Details" onEdit={handleEdit} />
                  <Box sx={{ px: 3, py: 2 }}>
                    <Grid container>
                      <Grid item xs={6}>
                        <FieldRow
                          label="Facility Type"
                          value={
                            p.facilityType
                              ? FACILITY_TYPE_LABELS[p.facilityType as FacilityType]
                              : null
                          }
                        />
                        <FieldRow
                          label="Dock Type"
                          value={
                            p.dockType
                              ? DOCK_TYPE_LABELS[p.dockType as DockType]
                              : null
                          }
                        />
                        <FieldRow label="Operating Hours" value={p.operatingHours} />
                        <FieldRow label="Receiving Hours" value={p.receivingHours} />
                      </Grid>
                      <Grid item xs={6}>
                        <FieldRow
                          label="Appointment"
                          value={
                            <Chip
                              label={p.appointmentRequired ? 'Required' : 'Walk-in'}
                              size="small"
                              color={p.appointmentRequired ? 'warning' : 'success'}
                              variant="outlined"
                            />
                          }
                        />
                        <FieldRow
                          label="Lumper"
                          value={
                            <Chip
                              label={p.lumperRequired ? 'Required' : 'Not Required'}
                              size="small"
                              color={p.lumperRequired ? 'warning' : 'default'}
                              variant="outlined"
                            />
                          }
                        />
                        <FieldRow
                          label="PPE"
                          value={
                            <Chip
                              label={p.ppeRequired ? 'Required' : 'Not Required'}
                              size="small"
                              color={p.ppeRequired ? 'warning' : 'default'}
                              variant="outlined"
                            />
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Card>

                {/* Contact Card */}
                <Card>
                  <SectionHeader title="Contact" onEdit={handleEdit} />
                  <Box sx={{ px: 3, py: 2 }}>
                    <Grid container>
                      <Grid item xs={6}>
                        <FieldRow label="Contact Name" value={p.contactName} />
                        <FieldRow label="Phone" value={p.contactPhone} />
                        <FieldRow label="Email" value={p.contactEmail} />
                      </Grid>
                      <Grid item xs={6}>
                        <FieldRow label="Check-in Procedures" value={p.checkInProcedures} />
                      </Grid>
                    </Grid>
                  </Box>
                </Card>

                {/* Notes Card */}
                <Card>
                  <SectionHeader title="Notes" onEdit={handleEdit} />
                  <Box sx={{ px: 3, py: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: p.notes ? 'text.primary' : 'text.disabled', whiteSpace: 'pre-wrap' }}
                    >
                      {p.notes || 'No notes added.'}
                    </Typography>
                  </Box>
                </Card>

                {/* Recent Loads at this Facility */}
                <Card>
                  <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
                    >
                      Recent Loads at this Facility
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 3,
                      py: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No loads have been assigned to this facility yet.
                    </Typography>
                  </Box>
                </Card>
              </Stack>
            </Box>
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default PlaceDetailPage;
