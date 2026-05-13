import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { Add as AddIcon, LocalShipping as LocalShippingIcon } from '@mui/icons-material';

import { Body, BodyMuted, SectionTitle } from 'components/Typography';
import type { VehicleEntry } from 'features/carrier-portal/types';

import EquipmentVehicleForm from '../EquipmentVehicleForm';
import type { EquipmentVehicleFormEntry } from '../EquipmentVehicleForm';
import EquipmentVehicleSummaryCard from '../EquipmentVehicleSummaryCard';

interface EquipmentPhaseSectionProps {
  fieldName: string;
  formik: {
    values: Record<string, unknown>;
    setFieldValue: (field: string, value: unknown) => void;
  };
}

interface StoredVehicle {
  localId: string;
  entry: VehicleEntry;
}

const seedFromAnswer = (value: unknown): StoredVehicle[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((row): row is VehicleEntry => Boolean(row && typeof row === 'object' && 'category' in row))
    .map((entry, index) => ({ localId: `v-${index}-${Date.now()}`, entry }));
};

const EquipmentPhaseSection: React.FC<EquipmentPhaseSectionProps> = ({ fieldName, formik }) => {
  const [vehicles, setVehicles] = useState<StoredVehicle[]>(() =>
    seedFromAnswer(formik.values[fieldName]),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const persist = useCallback(
    (next: StoredVehicle[]) => {
      setVehicles(next);
      formik.setFieldValue(
        fieldName,
        next.map((v) => v.entry),
      );
    },
    [fieldName, formik],
  );

  useEffect(() => {
    if (vehicles.length === 0) {
      setEditingId(null);
    }
  }, [vehicles.length]);

  const handleSave = useCallback(
    (saved: EquipmentVehicleFormEntry) => {
      const next = editingId
        ? vehicles.map((v) => (v.localId === saved.localId ? saved : v))
        : [...vehicles, saved];
      persist(next);
      setEditingId(null);
      setAddingNew(false);
    },
    [editingId, vehicles, persist],
  );

  const handleRemove = useCallback(
    (localId: string) => {
      persist(vehicles.filter((v) => v.localId !== localId));
    },
    [vehicles, persist],
  );

  const editingVehicle = useMemo(
    () => vehicles.find((v) => v.localId === editingId) ?? null,
    [vehicles, editingId],
  );

  const isEmpty = vehicles.length === 0 && !addingNew;

  return (
    <Box>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
        <SectionTitle>Vehicles</SectionTitle>
        <BodyMuted>
          {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} added
        </BodyMuted>
      </Stack>

      <Stack spacing={1.5}>
        {vehicles.map((vehicle) =>
          editingId === vehicle.localId ? (
            <EquipmentVehicleForm
              key={vehicle.localId}
              initial={vehicle}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <EquipmentVehicleSummaryCard
              key={vehicle.localId}
              vehicle={vehicle.entry}
              onEdit={() => {
                setAddingNew(false);
                setEditingId(vehicle.localId);
              }}
              onRemove={() => handleRemove(vehicle.localId)}
            />
          ),
        )}

        {addingNew && !editingVehicle ? (
          <EquipmentVehicleForm
            initial={null}
            onSave={handleSave}
            onCancel={() => setAddingNew(false)}
          />
        ) : null}

        {isEmpty ? (
          <Box
            sx={{
              p: 4,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              borderStyle: 'dashed',
              textAlign: 'center',
              bgcolor: 'grey.50',
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            <Body sx={{ color: 'text.primary', mb: 0.5 }}>No vehicles yet</Body>
            <BodyMuted sx={{ mb: 2 }}>
              Add each vehicle you operate so we can verify compliance and calculate rates.
            </BodyMuted>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddingNew(true)}
            >
              Add First Vehicle
            </Button>
          </Box>
        ) : null}

        {!isEmpty && !addingNew && !editingId ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddingNew(true)}
            sx={{ alignSelf: 'flex-start' }}
          >
            Add Vehicle
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
};

export default EquipmentPhaseSection;
