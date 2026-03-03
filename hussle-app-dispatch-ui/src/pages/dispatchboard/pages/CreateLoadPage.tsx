import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  OutlinedInput,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import type { FormikFieldProps } from '@mocho/ui/forms';
import {
  MainCard,
  PageHeader,
  PageWrapper,
  DateField,
  SelectField,
  TextField as MochoTextField,
  TimeField,
} from '@mocho/ui/components';

type StopType = 'pickup' | 'delivery';

interface StopFormValue {
  id: string;
  type: StopType;
  facility: string;
  address: string;
  city: string;
  state: string;
  date: string;
  time: string;
  commodity: string;
  weight: string;
  pieces: string;
  hazmat: boolean;
  tarpRequired: boolean;
  refNumber: string;
}

interface CreateLoadFormValues {
  broker: string;
  brokerRef: string;
  equipment: string;
  carrier: string;
  driver: string;
  rate: string;
  stops: StopFormValue[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

const stateCoordinates: Record<string, Coordinates> = {
  FL: { lat: 28.54, lng: -81.38 },
  GA: { lat: 33.75, lng: -84.39 },
  MD: { lat: 39.29, lng: -76.61 },
  NC: { lat: 35.23, lng: -80.84 },
  NJ: { lat: 40.73, lng: -74.17 },
  NY: { lat: 40.71, lng: -74.0 },
  PA: { lat: 40.0, lng: -75.13 },
  SC: { lat: 34.0, lng: -81.03 },
  TN: { lat: 36.16, lng: -86.78 },
  VA: { lat: 37.54, lng: -77.44 },
};

const createStopId = (): string => `stop-${Math.random().toString(36).slice(2, 12)}`;

const createNewStop = (type: StopType): StopFormValue => ({
  id: createStopId(),
  type,
  facility: '',
  address: '',
  city: '',
  state: '',
  date: '',
  time: '',
  commodity: '',
  weight: '',
  pieces: '',
  hazmat: false,
  tarpRequired: false,
  refNumber: '',
});

const getCoordinates = (stateCode: string): Coordinates | null => {
  const normalizedState = stateCode.trim().toUpperCase();
  return stateCoordinates[normalizedState] ?? null;
};

const haversineMiles = (from: Coordinates, to: Coordinates): number => {
  const earthRadiusMiles = 3959;
  const latitudeDiff = ((to.lat - from.lat) * Math.PI) / 180;
  const longitudeDiff = ((to.lng - from.lng) * Math.PI) / 180;

  const angleComponent =
    Math.sin(latitudeDiff / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(longitudeDiff / 2) ** 2;

  return (
    earthRadiusMiles * 2 * Math.atan2(Math.sqrt(angleComponent), Math.sqrt(1 - angleComponent))
  );
};

const validationSchema = Yup.object({
  broker: Yup.string().required('Broker is required'),
  equipment: Yup.string().required('Equipment is required'),
  carrier: Yup.string().required('Carrier is required'),
  driver: Yup.string().required('Driver is required'),
  rate: Yup.string().required('Customer rate is required'),
  stops: Yup.array()
    .of(
      Yup.object({
        address: Yup.string().required('Address is required'),
        city: Yup.string().required('City is required'),
        date: Yup.string().required('Date is required'),
        facility: Yup.string().required('Facility is required'),
        refNumber: Yup.string(),
        state: Yup.string().required('State is required'),
        time: Yup.string().required('Time is required'),
      }),
    )
    .min(2, 'At least two stops are required')
    .required(),
});

const parseWeight = (value: string): number => {
  const parsed = Number(value.replace(/[^0-9]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateTotalMiles = (stops: StopFormValue[]): number => {
  const total = stops.reduce((accumulator, stop, index) => {
    if (index === 0) {
      return accumulator;
    }

    const previousCoordinates = getCoordinates(stops[index - 1].state);
    const currentCoordinates = getCoordinates(stop.state);

    if (!previousCoordinates || !currentCoordinates) {
      return accumulator;
    }

    return accumulator + haversineMiles(previousCoordinates, currentCoordinates);
  }, 0);

  return Math.round(total);
};

interface RouteMapProps {
  stops: StopFormValue[];
  totalMiles: number;
}

interface PlottedStop extends StopFormValue {
  coordinates: Coordinates;
}

const hasCoordinates = (
  stop: StopFormValue & { coordinates: Coordinates | null },
): stop is PlottedStop => stop.coordinates !== null;

const RouteMap = ({ stops, totalMiles }: RouteMapProps) => {
  const plottedStops = stops
    .map((stop) => ({
      ...stop,
      coordinates: getCoordinates(stop.state),
    }))
    .filter(hasCoordinates);

  if (plottedStops.length === 0) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          backgroundColor: 'grey.100',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 220,
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          Enter stop states to preview route
        </Typography>
      </Box>
    );
  }

  const latitudes = plottedStops.map((stop) => stop.coordinates.lat);
  const longitudes = plottedStops.map((stop) => stop.coordinates.lng);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  const latitudePadding = Math.max((maxLatitude - minLatitude) * 0.25, 0.5);
  const longitudePadding = Math.max((maxLongitude - minLongitude) * 0.25, 0.5);

  const mapWidth = 600;
  const mapHeight = 220;

  const toX = (longitude: number): number =>
    ((longitude - (minLongitude - longitudePadding)) /
      (maxLongitude - minLongitude + 2 * longitudePadding)) *
    mapWidth;

  const toY = (latitude: number): number =>
    mapHeight -
    ((latitude - (minLatitude - latitudePadding)) /
      (maxLatitude - minLatitude + 2 * latitudePadding)) *
      mapHeight;

  const points = plottedStops.map((stop) => ({
    cityLabel: stop.city || stop.state,
    type: stop.type,
    x: toX(stop.coordinates.lng),
    y: toY(stop.coordinates.lat),
  }));

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg
        height={mapHeight}
        style={{ display: 'block', width: '100%' }}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
      >
        <defs>
          <pattern height="30" id="route-grid" patternUnits="userSpaceOnUse" width="30">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#d9e2ec" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect fill="url(#route-grid)" height={mapHeight} width={mapWidth} />

        {points.length > 1 && (
          <path
            d={path}
            fill="none"
            opacity="0.65"
            stroke="#3b82f6"
            strokeDasharray="8,4"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        )}

        {points.map((point, index) => {
          const markerColor = point.type === 'pickup' ? '#2563eb' : '#059669';
          const markerText = point.type === 'pickup' ? 'P' : 'D';

          return (
            <g key={`${point.type}-${point.x}-${point.y}`}>
              <circle
                cx={point.x}
                cy={point.y}
                fill="#fff"
                r="14"
                stroke={markerColor}
                strokeWidth="2"
              />
              <text
                dominantBaseline="middle"
                fill={markerColor}
                fontFamily="Inter, sans-serif"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                x={point.x}
                y={point.y + 1}
              >
                {markerText}
                {index + 1 > 2 ? index + 1 : ''}
              </text>
              <text
                fill="#475569"
                fontFamily="Inter, sans-serif"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
                x={point.x}
                y={point.y + 24}
              >
                {point.cityLabel}
              </text>
            </g>
          );
        })}
      </svg>

      <Box
        sx={{
          alignItems: 'baseline',
          backgroundColor: 'common.white',
          borderRadius: 1,
          boxShadow: 1,
          display: 'flex',
          gap: 0.5,
          px: 1.25,
          py: 0.75,
          position: 'absolute',
          right: 12,
          top: 12,
        }}
      >
        <Typography sx={{ fontWeight: 700 }} variant="h6">
          {totalMiles > 0 ? totalMiles.toLocaleString() : '—'}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          total mi
        </Typography>
      </Box>
    </Box>
  );
};

interface StopCardProps {
  onChange: (updatedStop: StopFormValue) => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onRemove: () => void;
  isDragTarget: boolean;
  isDragging: boolean;
  stop: StopFormValue;
  stopIndex: number;
  stopTotal: number;
}

const StopCard = ({
  onChange,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onRemove,
  isDragTarget,
  isDragging,
  stop,
  stopIndex,
  stopTotal,
}: StopCardProps) => {
  const [cargoOpen, setCargoOpen] = useState(stop.type === 'pickup');
  const isPickup = stop.type === 'pickup';

  const accentColor = isPickup ? 'primary.main' : 'success.main';
  const accentBackground = isPickup ? 'primary.50' : 'success.50';
  const stopLabel = isPickup ? 'Pickup' : 'Delivery';

  const updateField = <FieldKey extends keyof StopFormValue>(
    field: FieldKey,
    value: StopFormValue[FieldKey],
  ) => {
    onChange({
      ...stop,
      [field]: value,
    });
  };

  const handleStopFieldChange = (fieldName: string, value: string): void => {
    if (fieldName === 'facility') {
      updateField('facility', value);
      return;
    }

    if (fieldName === 'address') {
      updateField('address', value);
      return;
    }

    if (fieldName === 'city') {
      updateField('city', value);
      return;
    }

    if (fieldName === 'state') {
      updateField('state', value.toUpperCase().slice(0, 2));
      return;
    }

    if (fieldName === 'refNumber') {
      updateField('refNumber', value);
      return;
    }

    if (fieldName === 'date') {
      updateField('date', value);
      return;
    }

    if (fieldName === 'time') {
      updateField('time', value);
      return;
    }

    if (fieldName === 'commodity') {
      updateField('commodity', value);
      return;
    }

    if (fieldName === 'weight') {
      updateField('weight', value);
      return;
    }

    if (fieldName === 'pieces') {
      updateField('pieces', value);
    }
  };

  const stopFormik: FormikFieldProps<Record<string, unknown>> = {
    errors: {},
    handleBlur: () => {
      return;
    },
    handleChange: (event) => {
      handleStopFieldChange(event.target.name, event.target.value);
    },
    setFieldValue: (field, value) => {
      if (typeof value === 'string') {
        handleStopFieldChange(field, value);
      }
    },
    touched: {},
    values: {
      address: stop.address,
      city: stop.city,
      commodity: stop.commodity,
      date: stop.date,
      facility: stop.facility,
      pieces: stop.pieces,
      refNumber: stop.refNumber,
      state: stop.state,
      time: stop.time,
      weight: stop.weight,
    },
  };

  return (
    <Box
      draggable
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDragStart={onDragStart}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      sx={{
        backgroundColor: isDragTarget ? 'action.hover' : 'transparent',
        borderRadius: 1,
        cursor: isDragging ? 'grabbing' : 'default',
        opacity: isDragging ? 0.6 : 1,
        outline: isDragTarget ? '2px dashed' : 'none',
        outlineColor: isDragTarget ? 'primary.main' : 'transparent',
        transform: isDragging ? 'scale(0.995)' : 'scale(1)',
        transition: 'opacity 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
      }}
    >
      <MainCard
        content={false}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: '3px solid',
          borderLeftColor: accentColor,
          borderRadius: 1,
          boxShadow: 'none',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: accentBackground,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            minHeight: 44,
            px: 1.25,
            py: 0.75,
          }}
        >
          <Box
            aria-label="Drag to reorder"
            sx={{
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0.75,
              color: 'text.secondary',
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'inline-flex',
              height: 22,
              justifyContent: 'center',
              width: 22,
            }}
          >
            <Box
              sx={{
                columnGap: 0.35,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                rowGap: 0.35,
              }}
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <Box
                  key={`drag-dot-${index}`}
                  sx={{
                    backgroundColor: 'text.secondary',
                    borderRadius: '50%',
                    height: 3,
                    width: 3,
                  }}
                />
              ))}
            </Box>
          </Box>

          <Typography color="text.secondary" sx={{ minWidth: 16 }} variant="caption">
            {stopIndex + 1}
          </Typography>

          <Button
            aria-label={`Toggle stop type: ${stopLabel}`}
            onClick={() => updateField('type', isPickup ? 'delivery' : 'pickup')}
            size="small"
            variant="outlined"
            sx={{
              borderColor: accentColor,
              borderRadius: 1,
              color: accentColor,
              fontSize: 11,
              fontWeight: 600,
              minHeight: 24,
              minWidth: 98,
              px: 0.75,
              py: 0.25,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: accentBackground,
                borderColor: accentColor,
              },
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                backgroundColor: accentColor,
                borderRadius: 0.5,
                color: 'common.white',
                display: 'inline-flex',
                fontSize: 10,
                fontWeight: 700,
                height: 14,
                justifyContent: 'center',
                mr: 0.75,
                width: 14,
              }}
            >
              {isPickup ? 'P' : 'D'}
            </Box>
            <Typography
              component="span"
              sx={{ color: accentColor, fontSize: 11, fontWeight: 600, lineHeight: 1 }}
            >
              {stopLabel}
            </Typography>
            <Typography component="span" sx={{ color: accentColor, fontSize: 12, ml: 0.5 }}>
              ›
            </Typography>
          </Button>

          {stop.facility ? (
            <Typography sx={{ color: 'text.primary', fontWeight: 500 }} variant="body2">
              {stop.facility}
            </Typography>
          ) : null}

          {stop.city && stop.state ? (
            <Typography color="text.secondary" variant="caption">
              {`${stop.city}, ${stop.state.toUpperCase()}`}
            </Typography>
          ) : null}

          {isDragTarget ? (
            <Typography color="primary.main" variant="caption">
              Drop here to reorder
            </Typography>
          ) : null}

          <Box sx={{ flex: 1 }} />

          {stopTotal > 2 ? (
            <Button color="error" onClick={onRemove} size="small" variant="text">
              Remove
            </Button>
          ) : null}
        </Box>

        <Box sx={{ p: 1.5 }}>
          <Grid container spacing={1.5}>
            <Grid item md={4} xs={12}>
              <MochoTextField formik={stopFormik} label="Facility" name="facility" />
            </Grid>
            <Grid item md={8} xs={12}>
              <MochoTextField formik={stopFormik} label="Address" name="address" />
            </Grid>
            <Grid item md={2.4} xs={12}>
              <MochoTextField formik={stopFormik} label="City" name="city" />
            </Grid>
            <Grid item md={1.2} xs={12}>
              <MochoTextField formik={stopFormik} label="State" name="state" />
            </Grid>
            <Grid item md={2.2} xs={12}>
              <DateField formik={stopFormik} label="Date" name="date" />
            </Grid>
            <Grid item md={2.2} xs={12}>
              <TimeField formik={stopFormik} label="Time" name="time" />
            </Grid>
            <Grid item md={4} xs={12}>
              <MochoTextField formik={stopFormik} label="Ref #" name="refNumber" />
            </Grid>
          </Grid>

          <Box sx={{ mt: 1.5 }}>
            <Button onClick={() => setCargoOpen(!cargoOpen)} size="small" variant="text">
              {cargoOpen ? 'Hide Cargo' : 'Show Cargo'}
            </Button>
            <Collapse in={cargoOpen}>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item md={6} xs={12}>
                  <MochoTextField formik={stopFormik} label="Commodity" name="commodity" />
                </Grid>
                <Grid item md={3} xs={12}>
                  <MochoTextField formik={stopFormik} label="Weight" name="weight" />
                </Grid>
                <Grid item md={3} xs={12}>
                  <MochoTextField formik={stopFormik} label="Pieces" name="pieces" />
                </Grid>

                {isPickup ? (
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={stop.hazmat}
                            onChange={(_event, checked) => updateField('hazmat', checked)}
                            size="small"
                          />
                        }
                        label="Hazmat"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={stop.tarpRequired}
                            onChange={(_event, checked) => updateField('tarpRequired', checked)}
                            size="small"
                          />
                        }
                        label="Tarp Required"
                      />
                    </Stack>
                  </Grid>
                ) : null}
              </Grid>
            </Collapse>
          </Box>
        </Box>
      </MainCard>
    </Box>
  );
};

const CreateLoadPage = () => {
  const navigate = useNavigate();
  const [dragOverStopId, setDragOverStopId] = useState<string | null>(null);
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const formik = useFormik<CreateLoadFormValues>({
    initialValues: {
      broker: 'ABC Logistics',
      brokerRef: 'BRK-44521',
      carrier: 'Hustle Transportation (Company Asset)',
      driver: 'Marcus Johnson',
      equipment: 'Dry Van',
      rate: '2800',
      stops: [
        {
          ...createNewStop('pickup'),
          address: '1200 Distribution Blvd',
          city: 'Edison',
          commodity: 'Electronics',
          date: '2026-03-01',
          facility: 'Walmart DC #7102',
          pieces: '24 pallets',
          state: 'NJ',
          time: '08:00',
          weight: '42,000 lbs',
        },
        {
          ...createNewStop('delivery'),
          address: '4400 Distribution Way',
          city: 'Charlotte',
          date: '2026-03-02',
          facility: 'Target DC',
          state: 'NC',
          time: '14:00',
        },
      ],
    },
    onSubmit: async (_values, { setSubmitting }) => {
      setSubmitting(false);
    },
    validationSchema,
  });

  const totalMiles = useMemo(() => calculateTotalMiles(formik.values.stops), [formik.values.stops]);

  const totalWeight = useMemo(
    () => formik.values.stops.reduce((sum, stop) => sum + parseWeight(stop.weight), 0),
    [formik.values.stops],
  );

  const cargoStops = useMemo(
    () => formik.values.stops.filter((stop) => stop.commodity.trim().length > 0),
    [formik.values.stops],
  );

  const formattedRate = useMemo(() => {
    const numericRate = Number(formik.values.rate.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      return '—';
    }

    return `$${Math.round(numericRate).toLocaleString()}`;
  }, [formik.values.rate]);

  const updateStops = (nextStops: StopFormValue[]) => {
    void formik.setFieldValue('stops', nextStops);
  };

  const updateStop = (stopId: string, updatedStop: StopFormValue) => {
    const nextStops = formik.values.stops.map((stop) => {
      if (stop.id === stopId) {
        return updatedStop;
      }

      return stop;
    });

    updateStops(nextStops);
  };

  const removeStop = (stopId: string) => {
    if (formik.values.stops.length <= 2) {
      return;
    }

    const nextStops = formik.values.stops.filter((stop) => stop.id !== stopId);
    updateStops(nextStops);
  };

  const addStopToEnd = (type: StopType) => {
    updateStops([...formik.values.stops, createNewStop(type)]);
  };

  const mochoFormik: FormikFieldProps<Record<string, unknown>> = {
    errors: { ...formik.errors },
    handleBlur: formik.handleBlur,
    handleChange: formik.handleChange,
    setFieldValue: (field, value) => {
      void formik.setFieldValue(field, value);
    },
    touched: { ...formik.touched },
    values: { ...formik.values },
  };

  const moveStop = (draggedStopId: string, targetStopId: string) => {
    if (draggedStopId === targetStopId) {
      return;
    }

    const draggedIndex = formik.values.stops.findIndex((stop) => stop.id === draggedStopId);
    const targetIndex = formik.values.stops.findIndex((stop) => stop.id === targetStopId);

    if (draggedIndex < 0 || targetIndex < 0) {
      return;
    }

    const reorderedStops = [...formik.values.stops];
    const [draggedStop] = reorderedStops.splice(draggedIndex, 1);
    reorderedStops.splice(targetIndex, 0, draggedStop);
    updateStops(reorderedStops);
  };

  const handleStopDragEnd = () => {
    setDraggingStopId(null);
    setDragOverStopId(null);
  };

  return (
    <PageWrapper errorContext="CreateLoadPage">
      <Box component="form" onSubmit={formik.handleSubmit}>
        <PageHeader
          headerActions={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" variant="outlined">
                Save Draft
              </Button>
              <Button type="submit" variant="contained">
                Create as Booked
              </Button>
            </Stack>
          }
          onNavigate={() => navigate(-1)}
          showBackButton
          subtitle="Build and assign a load"
          title="Create New Load"
        />

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              lg: 'minmax(0, 1fr) 320px',
              xs: '1fr',
            },
          }}
        >
          <Box>
            <MainCard>
              <Grid container spacing={1.5}>
                <Grid item md={4} xs={12}>
                  <SelectField
                    data={[
                      { label: 'ABC Logistics', value: 'ABC Logistics' },
                      { label: 'XYZ Transport', value: 'XYZ Transport' },
                    ]}
                    formik={mochoFormik}
                    label="Broker"
                    name="broker"
                  />
                </Grid>
                <Grid item md={4} xs={12}>
                  <MochoTextField formik={mochoFormik} label="Broker Ref #" name="brokerRef" />
                </Grid>
                <Grid item md={4} xs={12}>
                  <SelectField
                    data={[
                      { label: 'Dry Van', value: 'Dry Van' },
                      { label: 'Flatbed', value: 'Flatbed' },
                      { label: 'Reefer', value: 'Reefer' },
                      { label: 'Step Deck', value: 'Step Deck' },
                    ]}
                    formik={mochoFormik}
                    label="Equipment"
                    name="equipment"
                  />
                </Grid>
              </Grid>
            </MainCard>

            <MainCard>
              <Stack spacing={1.5}>
                <Stack alignItems="center" direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
                    Route Map
                  </Typography>
                  <Button onClick={() => setShowMap(!showMap)} size="small" variant="text">
                    {showMap ? 'Hide' : 'Show'}
                  </Button>
                </Stack>

                {showMap ? <RouteMap stops={formik.values.stops} totalMiles={totalMiles} /> : null}
              </Stack>
            </MainCard>

            <MainCard>
              <Stack spacing={1.5}>
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                    Stops
                  </Typography>
                  <Chip label={formik.values.stops.length} size="small" />
                  <Typography color="text.secondary" variant="caption">
                    {`${totalMiles.toLocaleString()} total miles`}
                  </Typography>
                </Stack>

                <Typography color="text.secondary" variant="caption">
                  Drag and drop any stop card to reorder the route.
                </Typography>

                <Stack spacing={1.5}>
                  {formik.values.stops.map((stop, stopIndex) => (
                    <StopCard
                      key={stop.id}
                      onChange={(updatedStop) => updateStop(stop.id, updatedStop)}
                      onDragEnd={handleStopDragEnd}
                      onDragOver={() => setDragOverStopId(stop.id)}
                      onDragStart={() => setDraggingStopId(stop.id)}
                      onDrop={() => {
                        if (draggingStopId !== null) {
                          moveStop(draggingStopId, stop.id);
                        }
                        handleStopDragEnd();
                      }}
                      onRemove={() => removeStop(stop.id)}
                      isDragTarget={dragOverStopId === stop.id && draggingStopId !== stop.id}
                      isDragging={draggingStopId === stop.id}
                      stop={stop}
                      stopIndex={stopIndex}
                      stopTotal={formik.values.stops.length}
                    />
                  ))}
                </Stack>

                <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
                  <Button fullWidth onClick={() => addStopToEnd('pickup')} variant="outlined">
                    Add Pickup
                  </Button>
                  <Button
                    color="success"
                    fullWidth
                    onClick={() => addStopToEnd('delivery')}
                    variant="outlined"
                  >
                    Add Delivery
                  </Button>
                </Stack>
              </Stack>
            </MainCard>

            <MainCard>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="subtitle2">
                Assignment & Rate
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item md={6} xs={12}>
                  <SelectField
                    data={[
                      {
                        label: 'Hustle Transportation (Company Asset)',
                        value: 'Hustle Transportation (Company Asset)',
                      },
                      { label: 'JR Express LLC', value: 'JR Express LLC' },
                      { label: 'Summit Freight LLC', value: 'Summit Freight LLC' },
                    ]}
                    formik={mochoFormik}
                    label="Carrier"
                    name="carrier"
                  />
                </Grid>
                <Grid item md={6} xs={12}>
                  <SelectField
                    data={[
                      { label: 'Marcus Johnson', value: 'Marcus Johnson' },
                      { label: 'Devon Williams', value: 'Devon Williams' },
                      { label: 'James Davis', value: 'James Davis' },
                    ]}
                    formik={mochoFormik}
                    label="Driver"
                    name="driver"
                  />
                </Grid>
                <Grid item md={4} xs={12}>
                  <MochoTextField formik={mochoFormik} label="Customer Rate" name="rate" />
                </Grid>
                <Grid item md={4} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Vehicle</InputLabel>
                    <OutlinedInput
                      disabled
                      label="Vehicle"
                      value="#133718 — 2022 Freightliner Cascadia"
                    />
                  </FormControl>
                </Grid>
                <Grid item md={4} xs={12}>
                  <Button fullWidth sx={{ height: 40 }} variant="outlined">
                    Add Accessorial
                  </Button>
                </Grid>
              </Grid>
            </MainCard>
          </Box>

          <Stack sx={{ position: { lg: 'sticky', xs: 'static' }, top: 16 }}>
            <MainCard title="Rate Intelligence">
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="body2">
                    Your Rate
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }} variant="h6">
                    {formattedRate}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="caption">
                    Rate/Mile
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }} variant="caption">
                    {totalMiles > 0 && formattedRate !== '—'
                      ? `$${(Number(formik.values.rate.replace(/[^0-9.]/g, '')) / totalMiles).toFixed(2)}`
                      : '—'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="caption">
                    Market Avg (NJ→NC)
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }} variant="caption">
                    $3.8/mi
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="caption">
                    Min Book (#133718)
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }} variant="caption">
                    $900
                  </Typography>
                </Stack>
                <Chip
                  color="success"
                  label="$1,900 above min book · Above market avg"
                  size="small"
                />
              </Stack>
            </MainCard>

            <MainCard title="Route Summary">
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="body2">
                    Total Miles
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {totalMiles.toLocaleString()}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="body2">
                    Stops
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {formik.values.stops.length}
                  </Typography>
                </Stack>

                {cargoStops.length > 0 ? (
                  <Box>
                    <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="caption">
                      Cargo
                    </Typography>
                    <Stack spacing={0.5}>
                      {cargoStops.map((stop) => (
                        <Typography key={stop.id} variant="caption">
                          {`${stop.type === 'pickup' ? 'P' : 'D'} · ${stop.commodity}${
                            stop.weight ? ` · ${stop.weight}` : ''
                          }`}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                ) : null}

                {totalWeight > 0 ? (
                  <Typography color="text.secondary" variant="caption">
                    {`Total weight: ${totalWeight.toLocaleString()} lbs`}
                  </Typography>
                ) : null}
              </Stack>
            </MainCard>

            <MainCard title="Profit Breakdown">
              <Stack spacing={0.75}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="caption">
                    Revenue (rate + access.)
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }} variant="caption">
                    $2,875
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="caption">
                    Est. Fuel (620mi × $0.55)
                  </Typography>
                  <Typography color="error.main" sx={{ fontWeight: 600 }} variant="caption">
                    −$341
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="caption">
                    Est. Tolls (I-95 corridor)
                  </Typography>
                  <Typography color="error.main" sx={{ fontWeight: 600 }} variant="caption">
                    −$45
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary" variant="caption">
                    Deadhead cost (35mi)
                  </Typography>
                  <Typography color="error.main" sx={{ fontWeight: 600 }} variant="caption">
                    −$19
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}
                >
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    Net Profit
                  </Typography>
                  <Typography color="success.main" sx={{ fontWeight: 700 }} variant="body2">
                    $2,395
                  </Typography>
                </Stack>
              </Stack>
            </MainCard>
          </Stack>
        </Box>
      </Box>
    </PageWrapper>
  );
};

export default CreateLoadPage;
