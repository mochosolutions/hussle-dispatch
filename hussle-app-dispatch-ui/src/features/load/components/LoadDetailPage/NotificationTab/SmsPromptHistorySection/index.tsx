import { useEffect, useMemo } from 'react';
import { Box, Button, Chip } from '@mui/material';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { format, parseISO } from 'date-fns';
import type { ColDef } from 'ag-grid-community';
import SectionCard from 'components/SectionCard';
import NewDataGrid from 'mocho/components/NewDataGrid';
import { EmptyState } from 'mocho/components/EmptyState';
import { useDispatch, useSelector } from 'store';
import {
  startSmsPromptPolling,
  stopSmsPromptPolling,
} from 'features/load/store/reducers/loadPageSlice';
import { selectSmsPromptsByLoadId } from 'features/load/store/selectors/smsPromptSelectors';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';
import { SmsPromptAnchorChip } from './SmsPromptAnchorChip';

type Status = SmsPromptScheduleResponse['status'];
type Anchor = SmsPromptScheduleResponse['anchor'];

type ChipColor = 'default' | 'success' | 'warning' | 'error';

const STATUS_COLOR: Record<Status, ChipColor> = {
  PENDING: 'default',
  SENT: 'success',
  FAILED: 'error',
  CANCELED: 'warning',
};

const formatTimestamp = (iso: string | null): string =>
  iso ? format(parseISO(iso), 'MMM d, yyyy h:mm a') : '—';

interface SmsPromptHistorySectionProps {
  loadId: string;
}

export const SmsPromptHistorySection: React.FC<SmsPromptHistorySectionProps> = ({ loadId }) => {
  const dispatch = useDispatch();
  const { openModal } = useModalActions();
  const promptsSelector = useMemo(() => selectSmsPromptsByLoadId(loadId), [loadId]);
  const prompts = useSelector(promptsSelector);

  useEffect(() => {
    dispatch(startSmsPromptPolling({ loadId }));
    return () => {
      dispatch(stopSmsPromptPolling());
    };
  }, [dispatch, loadId]);

  const columnDefs = useMemo<ColDef<SmsPromptScheduleResponse>[]>(
    () => [
      {
        headerName: 'Anchor',
        field: 'anchor',
        width: 180,
        cellRenderer: (params: { value: Anchor }) => <SmsPromptAnchorChip anchor={params.value} />,
      },
      {
        headerName: 'Scheduled',
        field: 'scheduledAt',
        flex: 1,
        valueFormatter: (params: { value: string | null }) => formatTimestamp(params.value),
      },
      {
        headerName: 'Sent',
        field: 'sentAt',
        flex: 1,
        valueFormatter: (params: { value: string | null }) => formatTimestamp(params.value),
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 130,
        cellRenderer: (params: { value: Status }) => (
          <Chip
            label={params.value}
            color={STATUS_COLOR[params.value]}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        headerName: 'Reason',
        field: 'failureReason',
        flex: 1.5,
        valueFormatter: (params: { value: string | null }) => params.value ?? '',
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
    }),
    [],
  );

  const handleSendClick = () => openModal('loadSendSmsPrompt', { loadId });

  const sendButton = (
    <Button
      variant="outlined"
      size="small"
      startIcon={<SmsOutlinedIcon />}
      onClick={handleSendClick}
    >
      Send Check-in SMS
    </Button>
  );

  return (
    <SectionCard title="SMS to Driver" actions={sendButton} contentSX={{ p: 0 }}>
      {prompts.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <EmptyState variant="no-results" entityName="SMS prompt" compact />
        </Box>
      ) : (
        <Box sx={{ height: 420 }}>
          <NewDataGrid
            columnDefs={columnDefs}
            rowData={prompts}
            defaultColDef={defaultColDef}
            gridOptions={{
              rowHeight: 56,
              headerHeight: 44,
              pagination: true,
              paginationPageSize: 25,
              domLayout: 'normal',
            }}
          />
        </Box>
      )}
    </SectionCard>
  );
};

export default SmsPromptHistorySection;
