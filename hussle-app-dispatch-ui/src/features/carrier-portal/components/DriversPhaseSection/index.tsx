import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';

import { Body, BodyMuted, SectionTitle } from 'components/Typography';
import type { DriverEntry } from 'features/carrier-portal/types';

import DriverEntryForm from '../DriverEntryForm';
import type { DriverEntryFormValue } from '../DriverEntryForm';
import DriverSummaryCard from '../DriverSummaryCard';

interface DriversPhaseSectionProps {
  fieldName: string;
  formik: {
    values: Record<string, unknown>;
    setFieldValue: (field: string, value: unknown) => void;
  };
}

interface StoredDriver {
  localId: string;
  entry: DriverEntry;
}

const seedFromAnswer = (value: unknown): StoredDriver[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((row): row is DriverEntry => Boolean(row && typeof row === 'object' && 'firstName' in row))
    .map((entry, index) => ({ localId: `d-${index}-${Date.now()}`, entry }));
};

const DriversPhaseSection: React.FC<DriversPhaseSectionProps> = ({ fieldName, formik }) => {
  const [drivers, setDrivers] = useState<StoredDriver[]>(() =>
    seedFromAnswer(formik.values[fieldName]),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const persist = useCallback(
    (next: StoredDriver[]) => {
      setDrivers(next);
      formik.setFieldValue(
        fieldName,
        next.map((d) => d.entry),
      );
    },
    [fieldName, formik],
  );

  useEffect(() => {
    if (drivers.length === 0) {
      setEditingId(null);
    }
  }, [drivers.length]);

  const handleSave = useCallback(
    (saved: DriverEntryFormValue) => {
      const next = editingId
        ? drivers.map((d) => (d.localId === saved.localId ? saved : d))
        : [...drivers, saved];
      persist(next);
      setEditingId(null);
      setAddingNew(false);
    },
    [editingId, drivers, persist],
  );

  const handleRemove = useCallback(
    (localId: string) => {
      persist(drivers.filter((d) => d.localId !== localId));
    },
    [drivers, persist],
  );

  const editingDriver = useMemo(
    () => drivers.find((d) => d.localId === editingId) ?? null,
    [drivers, editingId],
  );

  const isEmpty = drivers.length === 0 && !addingNew;

  return (
    <Box>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
        <SectionTitle>Drivers</SectionTitle>
        <BodyMuted>
          {drivers.length} {drivers.length === 1 ? 'driver' : 'drivers'} added
        </BodyMuted>
      </Stack>

      <Stack spacing={1.5}>
        {drivers.map((driver) =>
          editingId === driver.localId ? (
            <DriverEntryForm
              key={driver.localId}
              initial={driver}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <DriverSummaryCard
              key={driver.localId}
              driver={driver.entry}
              onEdit={() => {
                setAddingNew(false);
                setEditingId(driver.localId);
              }}
              onRemove={() => handleRemove(driver.localId)}
            />
          ),
        )}

        {addingNew && !editingDriver ? (
          <DriverEntryForm initial={null} onSave={handleSave} onCancel={() => setAddingNew(false)} />
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
            <PersonIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            <Body sx={{ color: 'text.primary', mb: 0.5 }}>No drivers added yet</Body>
            <BodyMuted sx={{ mb: 2 }}>Add each driver who will run loads for you.</BodyMuted>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddingNew(true)}
            >
              Add First Driver
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
            Add Driver
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
};

export default DriversPhaseSection;
