import { Box, Button, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import { EmptyState } from '@mocho/ui/components';
import type { Driver } from 'features/carrier/types';
import { FieldRow } from 'components/FieldRow';
import SectionCard from 'components/SectionCard';

interface DriverWithCarrier extends Driver {
  carrierName: string | null;
  carrierType: string | null;
}

interface DriverPreferencesTabProps {
  driver: DriverWithCarrier;
  onEditPreferences: () => void;
}

export const DriverPreferencesTab: React.FC<DriverPreferencesTabProps> = ({
  driver: d,
  onEditPreferences,
}) => (
  <Box sx={{ p: 3, maxWidth: 1200 }}>
    <Stack spacing={2.5}>
      {/* Edit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onEditPreferences}
        >
          Edit Preferences
        </Button>
      </Box>

      {/* Preferred Lanes */}
      <SectionCard title="Preferred Lanes">
        <Box sx={{ px: 1.5, py: 1 }}>
          {d.preferredLanes.length > 0 ? (
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  {['Origin', 'Destination'].map((header) => (
                    <Box
                      component="th"
                      key={header}
                      sx={{
                        textAlign: 'left',
                        py: 1,
                        px: 1.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {header}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {d.preferredLanes.map((lane, i) => (
                  <Box component="tr" key={`lane-row-${String(i)}`}>
                    <Box component="td" sx={{ py: 1, px: 1.5 }}>
                      <Typography variant="body2">
                        {lane.originCity ? `${lane.originCity}, ${lane.originState}` : lane.originState}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ py: 1, px: 1.5 }}>
                      <Typography variant="body2">
                        {lane.destCity ? `${lane.destCity}, ${lane.destState}` : lane.destState}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <EmptyState title="No preferred lanes configured" />
          )}
        </Box>
      </SectionCard>

      {/* No-Go Zones */}
      <SectionCard title="No-Go Zones">
        <Box sx={{ px: 1.5, py: 1 }}>
          {d.noGoZones.length > 0 ? (
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  {['State', 'City'].map((header) => (
                    <Box
                      component="th"
                      key={header}
                      sx={{
                        textAlign: 'left',
                        py: 1,
                        px: 1.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {header}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {d.noGoZones.map((zone, i) => (
                  <Box component="tr" key={`zone-row-${String(i)}`}>
                    <Box component="td" sx={{ py: 1, px: 1.5 }}>
                      <Typography variant="body2">{zone.state}</Typography>
                    </Box>
                    <Box component="td" sx={{ py: 1, px: 1.5 }}>
                      <Typography variant="body2">{zone.city ?? '\u2014'}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <EmptyState title="No no-go zones configured" />
          )}
        </Box>
      </SectionCard>

      {/* Max Days Out */}
      <SectionCard title="General Preferences">
        <Box sx={{ px: 1.5, py: 1 }}>
          <FieldRow label="Max Days Out" value={d.maxDaysOut ?? '\u2014'} />
        </Box>
      </SectionCard>
    </Stack>
  </Box>
);
