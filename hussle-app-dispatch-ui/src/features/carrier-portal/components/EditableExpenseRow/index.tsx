import type { ChangeEvent } from 'react';
import { Box, IconButton, InputBase, Tooltip } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';

interface EditableExpenseRowProps {
  name: string;
  nameValue: string;
  onNameChange: (next: string) => void;
  namePlaceholder?: string;
  amount: string;
  onAmountChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
  amountPlaceholder?: string;
  onRemove?: () => void;
}

const InputAffix: React.FC<{ side: 'prefix' | 'suffix'; children: React.ReactNode }> = ({
  side,
  children,
}) => (
  <Box
    sx={{
      px: 1.25,
      bgcolor: 'grey.50',
      color: 'text.secondary',
      fontWeight: 700,
      fontSize: 12.5,
      display: 'flex',
      alignItems: 'center',
      borderRight: side === 'prefix' ? '1px solid' : 'none',
      borderLeft: side === 'suffix' ? '1px solid' : 'none',
      borderColor: 'grey.200',
    }}
  >
    {children}
  </Box>
);

const EditableExpenseRow: React.FC<EditableExpenseRowProps> = ({
  name,
  nameValue,
  onNameChange,
  namePlaceholder = 'Expense name',
  amount,
  onAmountChange,
  prefix,
  suffix,
  amountPlaceholder,
  onRemove,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 200px auto' },
        alignItems: 'center',
        gap: 1.5,
        py: 0.875,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          border: '1.5px solid',
          borderColor: nameValue ? 'grey.300' : 'grey.200',
          borderRadius: 0.75,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          transition: 'all 0.15s ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.10)',
          },
        }}
      >
        <InputBase
          id={`${name}-name`}
          name={`${name}-name`}
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={namePlaceholder}
          sx={{
            flex: 1,
            px: 1.25,
            py: 1,
            fontFamily: 'inherit',
            fontSize: 13.5,
            fontWeight: 500,
            color: 'text.primary',
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          border: '1.5px solid',
          borderColor: amount ? 'grey.300' : 'grey.200',
          borderRadius: 0.75,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          transition: 'all 0.15s ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.10)',
          },
        }}
      >
        {prefix ? <InputAffix side="prefix">{prefix}</InputAffix> : null}
        <InputBase
          id={`${name}-amount`}
          name={`${name}-amount`}
          value={amount}
          onChange={onAmountChange}
          placeholder={amountPlaceholder}
          sx={{
            flex: 1,
            px: 1.25,
            py: 1,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            color: 'text.primary',
            '& input': {
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              p: 0,
            },
          }}
        />
        {suffix ? <InputAffix side="suffix">{suffix}</InputAffix> : null}
      </Box>

      {onRemove ? (
        <Tooltip title="Remove" placement="top" arrow>
          <IconButton
            onClick={onRemove}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'error.main', bgcolor: 'rgba(220, 38, 38, 0.08)' },
            }}
          >
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : (
        <Box sx={{ display: { xs: 'none', sm: 'block' }, width: 32 }} />
      )}
    </Box>
  );
};

export default EditableExpenseRow;
