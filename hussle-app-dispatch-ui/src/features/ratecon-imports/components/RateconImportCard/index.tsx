import React from 'react';
import { Box, Button, Card, Chip, Stack } from '@mui/material';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'store';
import { Amount, Body, BodyMuted, BodyStrong, ErrorText, WarningText } from 'components/Typography';
import type { RateconImport, RateconImportStatus } from 'utils/api/ratecon-imports';
import {
  rejectImportRequest,
  retryImportRequest,
  reviewImportRequest,
} from '../../store/reducers';
import { selectImportActionLoading } from '../../store/selectors/rateconImportSelectors';

interface StatusMeta {
  label: string;
  color: 'default' | 'info' | 'warning' | 'error' | 'success';
}

const STATUS_META: Record<RateconImportStatus, StatusMeta> = {
  RECEIVED: { label: 'Queued', color: 'default' },
  EXTRACTING: { label: 'Extracting…', color: 'info' },
  PENDING_REVIEW: { label: 'Ready to review', color: 'warning' },
  ACCEPTED: { label: 'Accepted', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'default' },
  EXTRACTION_FAILED: { label: 'Extraction failed', color: 'error' },
};

const SOURCE_LABEL: Record<RateconImport['source'], string> = {
  EMAIL_INBOUND: 'Email',
  MANUAL_UPLOAD: 'Manual upload',
};

const formatReceived = (iso: string): string => {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? '' : format(parsed, 'MMM d, h:mm a');
};

const formatRate = (rate: string | null): string | null => {
  if (rate === null) {
    return null;
  }
  const value = Number(rate);
  return Number.isNaN(value) ? null : `$${value.toLocaleString()}`;
};

interface RateconImportCardProps {
  item: RateconImport;
}

export const RateconImportCard: React.FC<RateconImportCardProps> = ({ item }) => {
  const dispatch = useDispatch();

  const reviewing = useSelector(selectImportActionLoading('review', item.id));
  const rejecting = useSelector(selectImportActionLoading('reject', item.id));
  const retrying = useSelector(selectImportActionLoading('retry', item.id));

  const status = STATUS_META[item.status];
  const rate = formatRate(item.customerRate);
  const isFailed = item.status === 'EXTRACTION_FAILED';
  const isReviewable = item.status === 'PENDING_REVIEW';
  const isProcessing = item.status === 'RECEIVED' || item.status === 'EXTRACTING';

  const handleReview = () => dispatch(reviewImportRequest({ importId: item.id }));
  const handleReject = () => dispatch(rejectImportRequest({ importId: item.id }));
  const handleRetry = () => dispatch(retryImportRequest({ importId: item.id }));

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <BodyStrong>{item.brokerName ?? 'Unknown broker'}</BodyStrong>
            <BodyMuted>
              {SOURCE_LABEL[item.source]} · {formatReceived(item.receivedAt)}
            </BodyMuted>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            {item.matchedCustomerId !== null && (
              <Chip label="Customer matched" size="small" color="success" variant="outlined" />
            )}
            <Chip label={status.label} size="small" color={status.color} />
          </Stack>
        </Stack>

        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          {item.laneSummary !== null && <Body>{item.laneSummary}</Body>}
          {item.pickupDate !== null && (
            <BodyMuted>Pickup {formatReceived(item.pickupDate)}</BodyMuted>
          )}
          {rate !== null && <Amount>{rate}</Amount>}
        </Stack>

        {isFailed && item.failureReason !== null && (
          <ErrorText>{item.failureReason}</ErrorText>
        )}

        {item.requiresReview && item.warnings.length > 0 && (
          <WarningText>
            {item.warnings.length} item{item.warnings.length === 1 ? '' : 's'} need review
          </WarningText>
        )}

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          {isProcessing && <BodyMuted>Extracting — this can take up to a minute…</BodyMuted>}
          {isFailed && (
            <Button size="small" variant="outlined" onClick={handleRetry} disabled={retrying}>
              {retrying ? 'Retrying…' : 'Retry'}
            </Button>
          )}
          {isFailed && (
            <Button size="small" variant="outlined" onClick={handleReview} disabled={reviewing}>
              Open manually
            </Button>
          )}
          {isReviewable && (
            <Button
              size="small"
              variant="contained"
              onClick={handleReview}
              disabled={reviewing}
            >
              {reviewing ? 'Opening…' : 'Review'}
            </Button>
          )}
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={handleReject}
            disabled={rejecting}
          >
            {rejecting ? 'Rejecting…' : 'Reject'}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};
