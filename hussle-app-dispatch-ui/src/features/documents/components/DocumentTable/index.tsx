import { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { DownloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import type { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import { NewDataGrid } from '@mocho/ui/components';
import { useSelector, useDispatch } from 'store';
import { DOC_TYPE_CONFIG } from '../../constants';
import {
  fetchDocumentsRequest,
  bulkDownloadRequest,
} from '../../store/reducers/documentPageSlice';
import {
  selectDocumentsByEntity,
  selectDocumentsFetchLoading,
  selectBulkDownloadLoading,
} from '../../store/selectors/documentSelectors';
import type { Document, DocumentEntityType } from '../../types';

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

const DocTypeCellRenderer = ({ data }: { data: Document }) => (
  <Typography variant="caption" sx={{ fontWeight: 500 }}>
    {DOC_TYPE_CONFIG[data.type].label}
  </Typography>
);

const FileNameCellRenderer = ({ data }: { data: Document }) => (
  <Typography variant="body2" noWrap>
    {data.fileName}
  </Typography>
);

const DateCellRenderer = ({ value }: { value: string | null }) => (
  <Typography variant="caption" color="text.secondary">
    {value ? format(new Date(value), 'MMM d, yyyy') : ''}
  </Typography>
);

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

  const columnDefs = useMemo<ColDef<Document>[]>(
    () => [
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 140,
        flex: 1,
        cellRenderer: DocTypeCellRenderer,
        valueGetter: ({ data }) => (data ? DOC_TYPE_CONFIG[data.type].label : ''),
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
        minWidth: 120,
        flex: 1,
        cellRenderer: DateCellRenderer,
      },
    ],
    [],
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
      onSelectionChanged: handleSelectionChanged,
    }),
    [handleSelectionChanged],
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
