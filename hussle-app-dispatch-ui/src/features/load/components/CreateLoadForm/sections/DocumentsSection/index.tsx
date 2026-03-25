import { useState, useMemo, useCallback, useRef } from 'react';
import type { FormikProps } from 'formik';
import { Box, Card, Chip, Grid, IconButton, Stack, Typography, alpha } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import SectionCard from 'components/SectionCard';
import type { DocumentType } from 'features/documents/types';
import type { LoadFormValues } from '../../../../validators/loadSchema';
import type { QueuedDocument } from '../../../../types';
import { DOC_TYPE_CONFIG } from 'features/documents/constants';
import { CREATE_LOAD_DOC_CARD_CONFIG } from '../../../../constants';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  BROKER_RATE_CON: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  BOL_UNSIGNED: <InsertDriveFileOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  HAZMAT: <WarningAmberOutlinedIcon sx={{ fontSize: 24, color: 'warning.main' }} />,
  LOA: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  LUMPER_RECEIPT: <ReceiptLongOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  SCALE_TICKET: <ScaleOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const DocumentsSection: React.FC<{ formik: FormikProps<LoadFormValues> }> = ({ formik }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const queuedDocuments = useMemo(
    () => (formik.values.queuedDocuments ?? []) as QueuedDocument[],
    [formik.values.queuedDocuments],
  );

  const docCount = queuedDocuments.length;

  const handleAddFile = useCallback(
    (file: File) => {
      if (!selectedType) return;
      if (file.size > MAX_FILE_SIZE) return;

      const config = DOC_TYPE_CONFIG[selectedType];
      let updated: QueuedDocument[];

      if (config.onePer) {
        // Replace existing doc of this type
        updated = queuedDocuments.filter((d) => d.documentType !== selectedType);
      } else {
        updated = [...queuedDocuments];
      }

      const newDoc: QueuedDocument = {
        clientId: crypto.randomUUID(),
        file,
        documentType: selectedType,
      };
      updated = [...updated, newDoc];

      void formik.setFieldValue('queuedDocuments', updated);
      setIsPickerOpen(false);
      setSelectedType(null);
      setIsDragOver(false);
    },
    [formik, queuedDocuments, selectedType],
  );

  const handleRemove = useCallback(
    (clientId: string) => {
      void formik.setFieldValue(
        'queuedDocuments',
        queuedDocuments.filter((d) => d.clientId !== clientId),
      );
    },
    [formik, queuedDocuments],
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

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClosePicker = useCallback(() => {
    setIsPickerOpen(false);
    setSelectedType(null);
    setIsDragOver(false);
  }, []);

  const handleSelectType = useCallback((type: DocumentType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  }, []);

  const selectedConfig = selectedType
    ? CREATE_LOAD_DOC_CARD_CONFIG.find((c) => c.type === selectedType)
    : null;

  return (
    <SectionCard
      title="Load Documents"
      subheader="Attach rate confirmation, BOL, or other documents"
      actions={
        <Typography variant="body2" color="text.secondary">
          {docCount} document{docCount !== 1 ? 's' : ''}
        </Typography>
      }
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Attach documents at load creation. BOL, weight tickets and POD can be added once the load
          is in progress.
        </Typography>

        {/* Queued document rows */}
        {queuedDocuments.map((doc) => {
          const cardConfig = CREATE_LOAD_DOC_CARD_CONFIG.find((c) => c.type === doc.documentType);
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
                onClick={() => handleRemove(doc.clientId)}
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
              {CREATE_LOAD_DOC_CARD_CONFIG.map((config) => {
                const isSelected = selectedType === config.type;
                const docTypeInfo = DOC_TYPE_CONFIG[config.type];
                const hasExisting = queuedDocuments.some((d) => d.documentType === config.type);

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
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                role="button"
                tabIndex={0}
                aria-label={`Upload ${selectedConfig.shortLabel} document`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBrowseClick();
                  }
                }}
                sx={{
                  mt: 2,
                  border: '2px dashed',
                  borderColor: isDragOver ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragOver
                    ? (theme) => alpha(theme.palette.primary.main, 0.06)
                    : 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.light',
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                <FolderOpenIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Drop {selectedConfig.shortLabel} here or browse files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF or JPG / PNG · Max 20MB
                </Typography>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,image/jpeg,image/png"
              onChange={handleInputChange}
            />
          </Box>
        )}

        {/* "Add document" trigger */}
        {!isPickerOpen && (
          <Box
            onClick={() => setIsPickerOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Add document"
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
                Add document
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              PDF or image · Select type then upload
            </Typography>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
};
