import { useCallback, useRef, useState } from 'react';
import { Box, Chip } from '@mui/material';
import { Meta, MetaStrong, Timestamp } from 'components/Typography';
import type { FormikFieldProps } from '@mocho/ui/forms';
import {
  EntityAutocomplete,
} from 'components/EntityAutocomplete';
import type { EntityAutocompleteOption } from 'components/EntityAutocomplete';
import type { Place } from '../../types';
import { typeaheadPlaces } from 'utils/api/places/placeApi';
import { PlaceInfoDrawer } from '../PlaceInfoDrawer';

const FACILITY_TYPE_LABELS: Record<string, string> = {
  WAREHOUSE: 'Warehouse',
  DISTRIBUTION_CENTER: 'DC',
  MANUFACTURING: 'Mfg',
  COLD_STORAGE: 'Cold',
  CROSS_DOCK: 'Cross-Dock',
  PORT: 'Port',
  RAIL_YARD: 'Rail',
  DROP_YARD: 'Drop Yard',
  OTHER: 'Other',
};

export interface PlaceTypeaheadProps {
  name?: string;
  label?: string;
  formik: FormikFieldProps;
  onSelectPlace?: (place: Place | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}

export const PlaceTypeahead: React.FC<PlaceTypeaheadProps> = ({
  name = 'placeId',
  label = 'Place',
  formik,
  onSelectPlace,
  placeholder = 'Search place by name or city',
  disabled = false,
  required = false,
  helperText,
}) => {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const placesRef = useRef<Place[]>([]);

  const fetchPlaceOptions = useCallback(
    async (search: string): Promise<EntityAutocompleteOption[]> => {
      if (search.length < 2) {
        return [];
      }

      const places = await typeaheadPlaces(search, 10);
      placesRef.current = places;

      return places.map((place) => ({
        value: place.id,
        label: place.name,
        description: `${place.city}, ${place.state}`,
        metadata: {
          facilityType: place.facilityType ?? '',
          contactName: place.contactName ?? '',
        },
      }));
    },
    [],
  );

  const handleSelect = useCallback(
    (option: EntityAutocompleteOption | null) => {
      if (!onSelectPlace) {
        return;
      }

      if (!option) {
        onSelectPlace(null);
        return;
      }

      const place = placesRef.current.find((p) => p.id === option.value);
      if (place) {
        onSelectPlace(place);
      }
    },
    [onSelectPlace],
  );

  const handleOpenCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
  }, []);

  const renderPlaceOption = useCallback(
    (option: EntityAutocompleteOption) => {
      const facilityType = option.metadata?.facilityType as string;
      const contactName = option.metadata?.contactName as string;

      return (
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MetaStrong>{option.label}</MetaStrong>
            {facilityType && (
              <Chip
                label={FACILITY_TYPE_LABELS[facilityType] ?? facilityType}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.625rem' }}
              />
            )}
          </Box>
          <Meta>{option.description}</Meta>
          {contactName && <Timestamp sx={{ display: 'block' }}>{contactName}</Timestamp>}
        </Box>
      );
    },
    [],
  );

  return (
    <>
      <EntityAutocomplete
        name={name}
        label={label}
        formik={formik}
        fetchOptions={fetchPlaceOptions}
        renderOptionContent={renderPlaceOption}
        createNewLabel="Add New Place"
        onCreateNew={handleOpenCreateDrawer}
        onSelect={handleSelect}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        helperText={helperText}
        noOptionsText="Type at least 2 characters"
      />

      {createDrawerOpen && <PlaceInfoDrawer onClose={handleCloseCreateDrawer} />}
    </>
  );
};
