import { ButtonBase } from '@mui/material';
import { Add } from '@mui/icons-material';

interface ListBuilderAddMoreButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const ListBuilderAddMoreButton: React.FC<ListBuilderAddMoreButtonProps> = ({
  label,
  onClick,
  disabled,
}) => {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: '100%',
        border: '1.5px dashed',
        borderColor: 'grey.200',
        borderRadius: 1,
        py: 1.5,
        px: 2,
        color: 'text.secondary',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        '&:hover:not(:disabled)': {
          borderColor: 'primary.main',
          color: 'primary.main',
          bgcolor: 'primary.100',
        },
      }}
    >
      <Add sx={{ fontSize: 16 }} />
      {label}
    </ButtonBase>
  );
};

export default ListBuilderAddMoreButton;
