import { Box } from '@mui/material';

export type FileThumbFormat = 'pdf' | 'jpg' | 'png' | 'doc' | 'generic';

interface FileThumbProps {
  format: FileThumbFormat;
  error?: boolean;
  label?: string;
}

const FORMAT_TOKENS: Record<FileThumbFormat, { bg: string; color: string; label: string }> = {
  pdf: { bg: 'rgba(254, 226, 226, 1)', color: 'rgba(185, 28, 28, 1)', label: 'PDF' },
  jpg: { bg: 'rgba(219, 234, 254, 1)', color: 'rgba(30, 64, 175, 1)', label: 'JPG' },
  png: { bg: 'rgba(219, 234, 254, 1)', color: 'rgba(30, 64, 175, 1)', label: 'PNG' },
  doc: { bg: 'rgba(224, 231, 255, 1)', color: 'rgba(55, 48, 163, 1)', label: 'DOC' },
  generic: { bg: 'rgba(241, 245, 249, 1)', color: 'rgba(71, 85, 105, 1)', label: 'FILE' },
};

const ERROR_TOKENS = { bg: 'rgba(254, 226, 226, 1)', color: 'rgba(185, 28, 28, 1)' };

const FileThumb: React.FC<FileThumbProps> = ({ format, error = false, label }) => {
  const tokens = FORMAT_TOKENS[format];
  const colors = error ? ERROR_TOKENS : tokens;

  return (
    <Box
      sx={{
        width: 44,
        height: 56,
        borderRadius: 0.5,
        bgcolor: colors.bg,
        color: colors.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          borderWidth: '0 8px 8px 0',
          borderStyle: 'solid',
          borderColor: 'transparent #fff transparent transparent',
        },
      }}
    >
      {label ?? tokens.label}
    </Box>
  );
};

export default FileThumb;
