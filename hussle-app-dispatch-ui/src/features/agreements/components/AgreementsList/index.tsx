import { useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DownloadOutlined } from '@ant-design/icons';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { format } from 'date-fns';

import { useSelector, useDispatch } from 'store';
import { Body, BodyMuted } from 'components/Typography';
import { useModalActions } from 'features/ui/hooks/useModalActions';

import {
  fetchAgreementsRequest,
  requestAgreementRequest,
} from '../../store/reducers/agreementsSlice';
import {
  selectAgreementsByCarrier,
  selectAgreementsFetchLoading,
} from '../../store/selectors/agreementsSelectors';
import { downloadAgreementUrl } from 'utils/api/agreements';
import type { Agreement, AgreementStatus } from '../../types';

interface AgreementsListProps {
  carrierId: string;
}

const STATUS_COLOR: Record<AgreementStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default',
  PENDING: 'warning',
  SIGNED: 'success',
  VOIDED: 'error',
  EXPIRED: 'error',
  DECLINED: 'error',
};

const TEMPLATE_LABELS: Record<string, string> = {
  DISPATCH_AGREEMENT: 'Dispatch Agreement',
};

const formatTemplate = (templateKey: string): string =>
  TEMPLATE_LABELS[templateKey] ?? templateKey;

const formatSignedAt = (agreement: Agreement): string => {
  if (agreement.signedAt === null) {
    return '—';
  }
  return format(new Date(agreement.signedAt), 'MMM d, yyyy');
};

export const AgreementsList: React.FC<AgreementsListProps> = ({ carrierId }) => {
  const dispatch = useDispatch();
  const { openModal } = useModalActions();
  const agreements = useSelector((state) => selectAgreementsByCarrier(state, carrierId));
  const isLoading = useSelector((state) => selectAgreementsFetchLoading(state, carrierId));

  useEffect(() => {
    dispatch(fetchAgreementsRequest({ carrierId }));
  }, [dispatch, carrierId]);

  const rows = useMemo(() => agreements, [agreements]);

  const handleVoid = useCallback(
    (agreement: Agreement) => {
      openModal('voidAgreement', {
        agreementId: agreement.id,
        templateLabel: formatTemplate(agreement.templateKey),
      });
    },
    [openModal],
  );

  const handleRerequest = useCallback(
    (agreement: Agreement) => {
      dispatch(
        requestAgreementRequest({
          carrierId: agreement.carrierId,
          templateKey: agreement.templateKey,
        }),
      );
    },
    [dispatch],
  );

  if (isLoading && rows.length === 0) {
    return <BodyMuted sx={{ p: 2 }}>Loading agreements…</BodyMuted>;
  }

  if (rows.length === 0) {
    return <BodyMuted sx={{ p: 2 }}>No agreements on file.</BodyMuted>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Signer</TableCell>
            <TableCell>Signed</TableCell>
            <TableCell>Source</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((agreement) => {
            const downloadable =
              agreement.status === 'SIGNED' ||
              (agreement.signedAt !== null &&
                (agreement.status === 'VOIDED' || agreement.status === 'EXPIRED'));
            return (
              <TableRow key={agreement.id}>
                <TableCell>
                  <Body>{formatTemplate(agreement.templateKey)}</Body>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={agreement.status}
                    color={STATUS_COLOR[agreement.status]}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Body>{agreement.signerName ?? '—'}</Body>
                </TableCell>
                <TableCell>
                  <Body>{formatSignedAt(agreement)}</Body>
                </TableCell>
                <TableCell>
                  <BodyMuted>
                    {agreement.providerName === 'MANUAL' ? 'Manual upload' : agreement.providerName}
                  </BodyMuted>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {downloadable && (
                      <IconButton
                        size="small"
                        component="a"
                        href={downloadAgreementUrl(agreement.id, 'signed')}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Download signed PDF"
                      >
                        <DownloadOutlined />
                      </IconButton>
                    )}
                    {agreement.status === 'SIGNED' && (
                      <Button size="small" variant="outlined" onClick={() => handleVoid(agreement)}>
                        Void
                      </Button>
                    )}
                    {(agreement.status === 'VOIDED' ||
                      agreement.status === 'EXPIRED' ||
                      agreement.status === 'DECLINED') && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleRerequest(agreement)}
                      >
                        Re-request
                      </Button>
                    )}
                    {agreement.status === 'PENDING' && (
                      <Button size="small" variant="outlined" onClick={() => handleVoid(agreement)}>
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
