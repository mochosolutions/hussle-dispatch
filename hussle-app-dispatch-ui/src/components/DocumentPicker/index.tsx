import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import type { DocumentType } from 'features/documents/types';
import { DOC_TYPE_CONFIG } from 'features/documents/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueuedDocument {
  clientId: string;
  file: File;
  documentType: DocumentType;
}

export interface DocTypeCardConfig {
  type: DocumentType;
  shortLabel: string;
  description: string;
}

export interface DocumentPickerProps {
  /** Current queued documents */
  documents: QueuedDocument[];
  /** Called when a document is added */
  onAdd: (document: QueuedDocument) => void;
  /** Called when a document is removed by clientId */
  onRemove: (clientId: string) => void;
  /** Which document types are available for selection */
  docTypes: readonly DocTypeCardConfig[];
  /** Maximum file size in bytes (default: 20MB) */
  maxFileSize?: number;
  /** Accepted file types for the file input (default: PDF, JPEG, PNG) */
  acceptedFormats?: string;
  /** Prompt text shown in the "add document" trigger */
  addLabel?: string;
  /** Helper text shown below the add label */
  addHelperText?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_ACCEPTED_FORMATS = '.pdf,.jpg,.jpeg,.png,.webp';

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  BROKER_RATE_CON: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  BOL_UNSIGNED: <InsertDriveFileOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  HAZMAT: <WarningAmberOutlinedIcon sx={{ fontSize: 24, color: 'warning.main' }} />,
  LOA: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  LUMPER_RECEIPT: <ReceiptLongOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  SCALE_TICKET: <ScaleOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DocumentPicker: React.FC<DocumentPickerProps> = ({
  documents = [],
  onAdd,
  onRemove,
  docTypes = [],
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  addLabel = 'Add document',
  addHelperText = 'PDF or image \u00B7 Select type then upload',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddFile = useCallback(
    (file: File) => {
      if (!selectedType) return;
      if (file.size > maxFileSize) return;

      const newDoc: QueuedDocument = {
        clientId: crypto.randomUUID(),
        file,
        documentType: selectedType,
      };
      onAdd(newDoc);
      setIsPickerOpen(false);
      setSelectedType(null);
      setIsDragOver(false);
    },
    [selectedType, maxFileSize, onAdd],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleAddFile(file);
      }
    },
    [handleAddFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleAddFile(file);
      }
      e.target.value = '';
    },
    [handleAddFile],
  );

  const handleClosePicker = useCallback(() => {
    setIsPickerOpen(false);
    setSelectedType(null);
    setIsDragOver(false);
  }, []);

  const handleSelectType = useCallback((type: DocumentType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  }, []);

  const selectedConfig = selectedType
    ? docTypes.find((c) => c.type === selectedType)
    : null;

  const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));

  return (
    <Stack spacing={2}>
      {/* Queued document rows */}
      {documents.map((doc) => {
        const cardConfig = docTypes.find((c) => c.type === doc.documentType);
        return (
          <Stack
            key={doc.clientId}
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 1,
              backgroundColor: 'action.hover',
            }}
          >
            <InsertDriveFileOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Chip
              label={cardConfig?.shortLabel ?? doc.documentType}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {doc.file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {formatFileSize(doc.file.size)}
            </Typography>
            <IconButton
              size="small"
              aria-label={`Remove ${doc.file.name}`}
              onClick={() => onRemove(doc.clientId)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      })}

      {/* Type picker panel */}
      {isPickerOpen && (
        <Box
          sx={{
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
            borderRadius: 2,
            border: 1,
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
            p: 2.5,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              Step 1 — Select document type
            </Typography>
            <IconButton
              size="small"
              onClick={handleClosePicker}
              aria-label="Close document picker"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Grid container spacing={1.5}>
            {docTypes.map((config) => {
              const isSelected = selectedType === config.type;
              const docTypeInfo = DOC_TYPE_CONFIG[config.type];
              const hasExisting = documents.some((d) => d.documentType === config.type);

              return (
                <Grid item xs={6} key={config.type}>
                  <Card
                    variant="outlined"
                    onClick={() => handleSelectType(config.type)}
                    sx={{
                      cursor: 'pointer',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderWidth: isSelected ? 2 : 1,
                      backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        {DOC_TYPE_ICONS[config.type] ?? (
                          <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {config.shortLabel}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {config.description}
                      </Typography>
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                        {!docTypeInfo.onePer && (
                          <Chip
                            label="Multi"
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.675rem' }}
                          />
                        )}
                        {docTypeInfo.onePer && hasExisting && (
                          <Typography
                            variant="caption"
                            sx={{ color: 'warning.main', fontWeight: 500 }}
                          >
                            Replace
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Drop zone (when type selected) */}
          {selectedType && selectedConfig && (
            <>
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  mt: 2,
                  border: '2px dashed',
                  borderColor: isDragOver ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: isDragOver
                    ? (theme) => alpha(theme.palette.primary.main, 0.06)
                    : 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <FolderOpenIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Drag & drop {selectedConfig.shortLabel} here
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', mb: 0.5 }}
                >
                  Browse files
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  PDF, JPG, PNG · Max {maxSizeMB}MB
                </Typography>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats}
                onChange={handleInputChange}
                style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
              />
            </>
          )}
        </Box>
      )}

      {/* "Add document" trigger */}
      {!isPickerOpen && (
        <Box
          onClick={() => setIsPickerOpen(true)}
          role="button"
          tabIndex={0}
          aria-label={addLabel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsPickerOpen(true);
            }
          }}
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2.5,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.light',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <AddIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {addLabel}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {addHelperText}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};
