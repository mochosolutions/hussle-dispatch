import { useCallback, useEffect, useRef } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { SelectChangeEvent } from '@mui/material';
import { ListLayout } from 'components/ListLayout';
import { EmptyState } from 'mocho/components/EmptyState';
import { useDispatch, useSelector } from 'store';
import type {
  RateconImportSource,
  RateconImportStatus,
} from 'utils/api/ratecon-imports';
import {
  fetchImportsRequest,
  manualUploadRequest,
  setRateconFilters,
  startRateconPolling,
  stopRateconPolling,
} from '../../store/reducers';
import {
  selectFilteredRateconImports,
  selectRateconFilters,
  selectRateconManualUploading,
} from '../../store/selectors/rateconImportSelectors';
import { RateconImportCard } from '../../components/RateconImportCard';

const STATUS_OPTIONS: { label: string; value: RateconImportStatus | '' }[] = [
  { label: 'All active', value: '' },
  { label: 'Ready to review', value: 'PENDING_REVIEW' },
  { label: 'Extraction failed', value: 'EXTRACTION_FAILED' },
  { label: 'Queued', value: 'RECEIVED' },
  { label: 'Extracting', value: 'EXTRACTING' },
];

const SOURCE_OPTIONS: { label: string; value: RateconImportSource | '' }[] = [
  { label: 'All sources', value: '' },
  { label: 'Email', value: 'EMAIL_INBOUND' },
  { label: 'Manual upload', value: 'MANUAL_UPLOAD' },
];

const RateconImportsIndexPage = () => {
  const dispatch = useDispatch();
  const imports = useSelector(selectFilteredRateconImports);
  const filters = useSelector(selectRateconFilters);
  const uploading = useSelector(selectRateconManualUploading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchImportsRequest({}));
    dispatch(startRateconPolling());
    return () => {
      dispatch(stopRateconPolling());
    };
  }, [dispatch]);

  const handleStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value as RateconImportStatus | '';
      dispatch(setRateconFilters({ ...filters, status: value === '' ? undefined : value }));
    },
    [dispatch, filters],
  );

  const handleSourceChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value as RateconImportSource | '';
      dispatch(setRateconFilters({ ...filters, source: value === '' ? undefined : value }));
    },
    [dispatch, filters],
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setRateconFilters({ ...filters, search: event.target.value }));
    },
    [dispatch, filters],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        dispatch(manualUploadRequest({ file }));
      }
      // Reset so re-selecting the same file fires onChange again.
      event.target.value = '';
    },
    [dispatch],
  );

  return (
    <ListLayout
      title="Rate Cons"
      primaryAction={
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Import rate-con'}
        </Button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleFileSelected}
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
          px: { xs: 2, sm: 3 },
          pt: 2,
        }}
      >
        <TextField
          value={filters.search ?? ''}
          onChange={handleSearchChange}
          placeholder="Search broker, lane, sender…"
          size="small"
          sx={{ width: { xs: '100%', md: 260 } }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="ratecon-status-label">Status</InputLabel>
          <Select
            labelId="ratecon-status-label"
            label="Status"
            value={filters.status ?? ''}
            onChange={handleStatusChange}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="ratecon-source-label">Source</InputLabel>
          <Select
            labelId="ratecon-source-label"
            label="Source"
            value={filters.source ?? ''}
            onChange={handleSourceChange}
          >
            {SOURCE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, flex: 1, minHeight: 0 }}>
        {imports.length === 0 ? (
          <EmptyState
            variant="custom"
            icon="📨"
            title="No rate-cons to review"
            message="Forward broker rate confirmations to your import address and they'll appear here automatically — or import a PDF manually."
            actionText="Import rate-con"
            onAction={handleUploadClick}
          />
        ) : (
          <Stack spacing={1.5}>
            {imports.map((item) => (
              <RateconImportCard key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </Box>
    </ListLayout>
  );
};

export default RateconImportsIndexPage;
