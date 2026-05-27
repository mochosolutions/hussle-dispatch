import { ButtonBase } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';

interface LedgerAddRowProps {
  label: string;
  onClick?: () => void;
}

const LedgerAddRow: React.FC<LedgerAddRowProps> = ({ label, onClick }) => {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        my: 1,
        mb: 0.5,
        px: 1.5,
        py: 1,
        border: '1.5px dashed',
        borderColor: 'grey.300',
        borderRadius: 0.75,
        color: 'text.secondary',
        fontFamily: 'inherit',
        fontSize: 12.5,
        fontWeight: 500,
        transition: 'all 0.15s ease',
        '& svg': { fontSize: 14 },
        '&:hover': {
          borderColor: 'primary.main',
          color: 'primary.main',
        },
      }}
    >
      <AddOutlined />
      {label}
    </ButtonBase>
  );
};

export default LedgerAddRow;
