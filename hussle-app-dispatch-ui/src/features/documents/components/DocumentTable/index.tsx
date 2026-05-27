import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import { DownloadOutlined } from '@ant-design/icons';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { format } from 'date-fns';
import type { ColDef, RowClickedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { NewDataGrid } from '@mocho/ui/components';

import { useSelector, useDispatch } from 'store';
import config from '../../../../config';
import { Body, BodyMuted } from 'components/Typography';
import { formatBytes } from 'utils/documents/formatBytes';
import { formattedCurrentUserSelector } from 'features/auth/store/selectors';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import { EmptyState } from 'mocho/components/EmptyState/EmptyState';

import { DOC_TYPE_CONFIG, type DocumentContext } from '../../constants';
import {
  bulkDownloadRequest,
  fetchDocumentsRequest,
} from '../../store/reducers/documentPageSlice';
import {
  selectBulkDownloadLoading,
  selectDocumentsByEntity,
  selectDocumentsFetchLoading,
} from '../../store/selectors/documentSelectors';
import {
  DocumentType,
  type Document,
  type DocumentEntityType,
} from '../../types';
import { ExpiryBadge } from '../ExpiryBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENTITY_TO_CONTEXT: Record<DocumentEntityType, DocumentContext> = {
  load: 'load-detail',
  carrier: 'carrier-detail',
  driver: 'driver-detail',
  vehicle: 'vehicle-detail',
  invoice: 'invoice-detail',
};

const isStringValue = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const getCustomLabel = (metadata: Record<string, unknown> | null): string | undefined => {
  if (metadata === null) {
    return undefined;
  }
  const value = metadata.customLabel;
  return isStringValue(value) ? value : undefined;
};

const getTypeLabelForDoc = (doc: Document): string => {
  if (doc.type === DocumentType.OTHER) {
    const customLabel = getCustomLabel(doc.metadata);
    if (customLabel !== undefined) {
      return customLabel;
    }
  }
  return DOC_TYPE_CONFIG[doc.type]?.label ?? doc.type;
};

const formatDate = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return format(new Date(value), 'MMM d, yyyy');
};

// ---------------------------------------------------------------------------
// Cell renderers (named exports for testability)
// ---------------------------------------------------------------------------

const getFileTypeIcon = (mimeType: string | null) => {
  if (mimeType === 'application/pdf') {
    return <PictureAsPdfOutlinedIcon fontSize="small" sx={{ color: 'error.main' }} />;
  }
  if (mimeType !== null && mimeType.startsWith('image/')) {
    return <ImageOutlinedIcon fontSize="small" sx={{ color: 'info.main' }} />;
  }
  return <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
};

const isPendingUpload = (doc: Document): boolean => {
  // Backend writes "confirmed" after confirmDocument runs successfully.
  // Anything else (pending, presigned, failed) is an unconfirmed record.
  return doc.uploadStatus !== 'confirmed';
};

export const DocTypeCellRenderer = ({ data }: { data: Document }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
    {getFileTypeIcon(data.mimeType)}
    <Body sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {getTypeLabelForDoc(data)}
    </Body>
    {isPendingUpload(data) && (
      <Chip
        label="pending upload"
        size="small"
        color="warning"
        variant="outlined"
        sx={{ height: 20, fontSize: 11 }}
      />
    )}
  </Stack>
);

export const FileNameCellRenderer = ({ data }: { data: Document }) => (
  <Body sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
    {data.fileName}
  </Body>
);

export const UploadedByCellRenderer = ({ data }: { data: Document }) => {
  const uploader = data.uploadedBy;
  const name = uploader
    ? `${uploader.firstName} ${uploader.lastName}`.trim()
    : '';
  return <Body>{name === '' ? '—' : name}</Body>;
};

export const SizeCellRenderer = ({ data }: { data: Document }) => (
  <BodyMuted>{formatBytes(data.fileSize)}</BodyMuted>
);

export const DateCellRenderer = ({ value }: { value: string | null }) => (
  <BodyMuted>{formatDate(value)}</BodyMuted>
);

export const ExpiresCellRenderer = ({ value }: { value: string | null }) => {
  const formatted = formatDate(value);
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Body>{formatted === '' ? '—' : formatted}</Body>
      <ExpiryBadge expiresAt={value} />
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Actions cell renderer
// ---------------------------------------------------------------------------

export interface ActionsCellRendererProps {
  data: Document;
  entityType: DocumentEntityType;
  entityId: string;
  isAdmin: boolean;
}

export const ActionsCellRenderer: React.FC<ActionsCellRendererProps> = ({
  data,
  entityType,
  entityId,
  isAdmin,
}) => {
  const { openDrawer } = useDrawerActions();
  const { openModal } = useModalActions();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (event?: React.MouseEvent | object) => {
    if (event && 'stopPropagation' in event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleView = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
    openDrawer('documentDetail', { documentId: data.id });
  };

  const handleDownload = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
    const downloadUrl = `${config.apiUrl}/api/v1/documents/${data.id}/download`;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReplace = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
    openDrawer('documentUpload', {
      context: ENTITY_TO_CONTEXT[entityType],
      entityType,
      entityId,
      preselectedDocType: data.type,
      lockDocType: true,
    });
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
    openModal('confirmDeleteDocument', {
      documentId: data.id,
      fileName: data.fileName,
      type: data.type,
    });
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <IconButton
        size="small"
        onClick={handleOpenMenu}
        aria-label="Document actions"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleView}>View</MenuItem>
        <MenuItem onClick={handleDownload}>Download</MenuItem>
        <MenuItem onClick={handleReplace}>Replace</MenuItem>
        {isAdmin && <Divider />}
        {isAdmin && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DocumentTableProps {
  entityType: DocumentEntityType;
  entityId: string;
  onUpload?: () => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({ entityType, entityId, onUpload }) => {
  const dispatch = useDispatch();
  const documents = useSelector(selectDocumentsByEntity(entityType, entityId));
  const isLoading = useSelector(selectDocumentsFetchLoading(entityType, entityId));
  const isDownloading = useSelector(selectBulkDownloadLoading);
  const currentUser = useSelector(formattedCurrentUserSelector);
  const isAdmin = currentUser.role === 'ADMIN';
  const { openDrawer } = useDrawerActions();
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchDocumentsRequest({ entityType, entityId }));
  }, [dispatch, entityType, entityId]);

  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<Document>) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedDocIds(selectedRows.map((row) => row.id));
  }, []);

  const handleBulkDownload = useCallback(() => {
    if (selectedDocIds.length === 0) {
      return;
    }
    dispatch(bulkDownloadRequest({ documentIds: selectedDocIds }));
    setSelectedDocIds([]);
  }, [dispatch, selectedDocIds]);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<Document>) => {
      if (event.data) {
        openDrawer('documentDetail', { documentId: event.data.id });
      }
    },
    [openDrawer],
  );

  const ActionsRenderer = useCallback(
    ({ data }: { data: Document }) => (
      <ActionsCellRenderer
        data={data}
        entityType={entityType}
        entityId={entityId}
        isAdmin={isAdmin}
      />
    ),
    [entityType, entityId, isAdmin],
  );

  const columnDefs = useMemo<ColDef<Document>[]>(
    () => [
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 200,
        flex: 1.4,
        cellRenderer: DocTypeCellRenderer,
        valueGetter: ({ data }) => (data ? getTypeLabelForDoc(data) : ''),
      },
      {
        headerName: 'File Name',
        field: 'fileName',
        minWidth: 180,
        flex: 2,
        cellRenderer: FileNameCellRenderer,
      },
      {
        headerName: 'Uploaded By',
        field: 'uploadedByUserId',
        minWidth: 140,
        flex: 1,
        cellRenderer: UploadedByCellRenderer,
        valueGetter: ({ data }) =>
          data?.uploadedBy
            ? `${data.uploadedBy.firstName} ${data.uploadedBy.lastName}`.trim()
            : '',
      },
      {
        headerName: 'Size',
        field: 'fileSize',
        minWidth: 100,
        width: 100,
        cellRenderer: SizeCellRenderer,
      },
      {
        headerName: 'Uploaded',
        field: 'createdAt',
        minWidth: 120,
        flex: 1,
        cellRenderer: DateCellRenderer,
        sort: 'desc',
      },
      {
        headerName: 'Expires',
        field: 'expiresAt',
        minWidth: 180,
        flex: 1,
        cellRenderer: ExpiresCellRenderer,
      },
      {
        headerName: 'Actions',
        field: 'id',
        width: 96,
        minWidth: 96,
        maxWidth: 96,
        pinned: 'right',
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: ActionsRenderer,
      },
    ],
    [ActionsRenderer],
  );

  const defaultColDef = useMemo<ColDef<Document>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
    }),
    [],
  );

  const gridOptions = useMemo(
    () => ({
      pagination: true,
      paginationPageSize: 25,
      suppressCellFocus: true,
      headerHeight: 44,
      rowHeight: 56,
      rowSelection: 'multiple' as const,
      suppressRowClickSelection: true,
      onSelectionChanged: handleSelectionChanged,
      onRowClicked: handleRowClicked,
    }),
    [handleSelectionChanged, handleRowClicked],
  );

  return (
    <Box>
      {selectedDocIds.length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<DownloadOutlined />}
            onClick={handleBulkDownload}
            disabled={isDownloading}
          >
            {isDownloading
              ? 'Downloading...'
              : `Download Selected (${String(selectedDocIds.length)})`}
          </Button>
        </Box>
      )}

      <Box sx={{ height: 480, display: 'flex', flexDirection: 'column' }}>
      <NewDataGrid
        columnDefs={columnDefs}
        rowData={documents}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        loading={isLoading}
        noDataComponent={
          <EmptyState
            variant="no-data"
            entityName="Documents"
            message="No documents have been uploaded yet."
            actionText={onUpload ? 'Upload Document' : undefined}
            onAction={onUpload}
            compact
          />
        }
      />
      </Box>
    </Box>
  );
};
