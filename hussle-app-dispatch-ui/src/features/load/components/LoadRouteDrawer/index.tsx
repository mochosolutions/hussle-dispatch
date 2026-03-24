import React, { useState, useCallback } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { EditDrawer, DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import {
  createStopRequest,
  updateStopRequest,
  deleteStopRequest,
  reorderStopsRequest,
} from '../../store/reducers';
import type { LoadDetail, Stop } from '../../types';
import type { StopFormValues } from '../../validators/stopSchema';
import { EditableStopCard } from './EditableStopCard';

interface LoadRouteDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

export const LoadRouteDrawer: React.FC<LoadRouteDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();
  const [addingNew, setAddingNew] = useState(false);

  const sortedStops = [...(load.stops ?? [])].sort((a, b) => a.sequence - b.sequence);

  const handleSaveExisting = useCallback(
    (stop: Stop) => (values: StopFormValues) => {
      dispatch(
        updateStopRequest({
          loadId: load.id,
          stopId: stop.id,
          data: values,
        }),
      );
    },
    [dispatch, load.id],
  );

  const handleCreateStop = useCallback(
    (values: StopFormValues) => {
      dispatch(
        createStopRequest({
          loadId: load.id,
          data: {
            ...values,
            sequence: sortedStops.length,
          },
        }),
      );
      setAddingNew(false);
    },
    [dispatch, load.id, sortedStops.length],
  );

  const handleDeleteStop = useCallback(
    (stopId: string) => {
      dispatch(deleteStopRequest({ loadId: load.id, stopId }));
    },
    [dispatch, load.id],
  );

  const handleMoveUp = useCallback(
    (index: number) => () => {
      if (index === 0) return;
      const current = sortedStops[index];
      const above = sortedStops[index - 1];
      dispatch(
        reorderStopsRequest({
          loadId: load.id,
          stopOrder: [
            { id: current.id, sequence: above.sequence },
            { id: above.id, sequence: current.sequence },
          ],
        }),
      );
    },
    [dispatch, load.id, sortedStops],
  );

  const handleMoveDown = useCallback(
    (index: number) => () => {
      if (index >= sortedStops.length - 1) return;
      const current = sortedStops[index];
      const below = sortedStops[index + 1];
      dispatch(
        reorderStopsRequest({
          loadId: load.id,
          stopOrder: [
            { id: current.id, sequence: below.sequence },
            { id: below.id, sequence: current.sequence },
          ],
        }),
      );
    },
    [dispatch, load.id, sortedStops],
  );

  const handleCancelNew = useCallback(() => {
    setAddingNew(false);
  }, []);

  const handleAddStop = useCallback(() => {
    setAddingNew(true);
  }, []);

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button variant="outlined" onClick={onClose}>
        Done
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      title="Edit Route"
      subtitle={load.loadNumber}
      onClose={onClose}
      isDirty={false}
      footer={footer}
    >
      <Stack spacing={2.5} sx={{ p: 3 }}>
        <DrawerSection label={`Stops (${sortedStops.length})`}>
          <Stack spacing={1.5}>
            {sortedStops.map((stop, index) => (
              <EditableStopCard
                key={stop.id}
                stop={stop}
                index={index}
                isFirst={index === 0}
                isLast={index === sortedStops.length - 1}
                onSave={handleSaveExisting(stop)}
                onDelete={handleDeleteStop}
                onMoveUp={handleMoveUp(index)}
                onMoveDown={handleMoveDown(index)}
              />
            ))}

            {addingNew && (
              <EditableStopCard
                index={sortedStops.length}
                isFirst={sortedStops.length === 0}
                isLast
                isNew
                onSave={handleCreateStop}
                onCancelNew={handleCancelNew}
              />
            )}
          </Stack>
        </DrawerSection>

        {!addingNew && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddStop}
            fullWidth
            sx={{ borderStyle: 'dashed' }}
          >
            Add Stop
          </Button>
        )}

        {sortedStops.length === 0 && !addingNew && (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
            No stops defined. Add a stop to build the route.
          </Typography>
        )}
      </Stack>
    </EditDrawer>
  );
};
