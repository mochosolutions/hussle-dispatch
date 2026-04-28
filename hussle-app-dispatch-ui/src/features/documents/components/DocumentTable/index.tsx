import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import { DownloadOutlined } from '@ant-design/icons';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { format } from 'date-fns';
import type { ColDef, RowClickedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { NewDataGrid } from '@mocho/ui/components';

import { useSelector, useDispatch } from 'store';
import { Body, BodyMuted } from 'components/Typography';
import { formattedCurrentUserSelector } from 'features/auth/store/selectors';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { useModalActions } from 'features/ui/hooks/useModalActions';

import { DOC_TYPE_CONFIG, type DocumentContext } from '../../constants';
import {
  bulkDownloadRequest,
  fetchDocumentsRequest,
  getDownloadUrlRequest,
} from '../../store/reducers/documentPageSlice';
import {
  selectBulkDownloadLoading,
  selectDocumentsByEntity,
  selectDocumentsFetchLoading,
  selectDownloadUrlByDocId,
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
  driver: 'driver-profile',
  vehicle: 'vehicle-detail',
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

export const DocTypeCellRenderer = ({ data }: { data: Document }) => (
  <Body sx={{ fontWeight: 500 }}>{getTypeLabelForDoc(data)}</Body>
);

export const FileNameCellRenderer = ({ data }: { data: Document }) => (
  <Body sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
    {data.fileName}
  </Body>
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
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { openModal } = useModalActions();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pendingDownload, setPendingDownload] = useState<boolean>(false);

  const downloadUrl = useSelector(selectDownloadUrlByDocId(data.id));
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (pendingDownload && isStringValue(downloadUrl)) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      setPendingDownload(false);
    }
  }, [pendingDownload, downloadUrl]);

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
    if (isStringValue(downloadUrl)) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setPendingDownload(true);
    dispatch(getDownloadUrlRequest({ documentId: data.id }));
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
}

export const DocumentTable: React.FC<DocumentTableProps> = ({ entityType, entityId }) => {
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
        minWidth: 140,
        flex: 1,
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
        headerName: '',
        field: 'id',
        width: 56,
        minWidth: 56,
        maxWidth: 56,
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
      domLayout: 'autoHeight' as const,
      pagination: false,
      suppressCellFocus: true,
      headerHeight: 40,
      rowHeight: 48,
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

      <NewDataGrid
        columnDefs={columnDefs}
        rowData={documents}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        loading={isLoading}
        noDataMessage="No documents uploaded yet"
      />
    </Box>
  );
};
