import type { ChangeEvent, ReactNode } from 'react';
import { Box, InputBase, Tooltip } from '@mui/material';
import { CheckCircleOutline, InfoOutlined } from '@mui/icons-material';

import { Body, Meta } from 'components/Typography';

export type ExpenseSourceVariant = 'blue' | 'green';

export interface ExpenseSource {
  label: string;
  variant?: ExpenseSourceVariant;
}

interface ExpenseRowProps {
  name: string;
  label: string;
  helper?: string;
  info?: string;
  source?: ExpenseSource;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  placeholder?: string;
}

const SOURCE_TOKENS: Record<ExpenseSourceVariant, { bg: string; color: string }> = {
  blue: { bg: 'rgba(239, 246, 255, 1)', color: 'rgba(37, 99, 235, 1)' },
  green: { bg: 'rgba(220, 252, 231, 1)', color: 'rgba(22, 163, 74, 1)' },
};

const SourcePill: React.FC<{ source: ExpenseSource }> = ({ source }) => {
  const tokens = SOURCE_TOKENS[source.variant ?? 'blue'];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.02em',
        px: 0.75,
        py: 0.125,
        borderRadius: '999px',
        bgcolor: tokens.bg,
        color: tokens.color,
        '& svg': { fontSize: 11 },
      }}
    >
      <CheckCircleOutline />
      {source.label}
    </Box>
  );
};

const InputAffix: React.FC<{ side: 'prefix' | 'suffix'; children: ReactNode }> = ({
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

const ExpenseRow: React.FC<ExpenseRowProps> = ({
  name,
  label,
  helper,
  info,
  source,
  prefix,
  suffix,
  value,
  onChange,
  readOnly = false,
  placeholder,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 200px' },
        alignItems: 'center',
        gap: 1.5,
        py: 0.875,
      }}
    >
      <Box
        component="label"
        htmlFor={name}
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          color: 'text.primary',
        }}
      >
        <Body sx={{ fontSize: 13.5, fontWeight: 500 }}>{label}</Body>
        {helper ? (
          <Meta sx={{ fontSize: 11.5, fontWeight: 500 }}>{helper}</Meta>
        ) : null}
        {source ? <SourcePill source={source} /> : null}
        {info ? (
          <Tooltip title={info} placement="top" arrow>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                color: 'text.secondary',
                cursor: 'help',
                '& svg': { fontSize: 14 },
              }}
            >
              <InfoOutlined />
            </Box>
          </Tooltip>
        ) : null}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          border: '1.5px solid',
          borderColor: !readOnly && value ? 'grey.300' : 'grey.200',
          borderRadius: 0.75,
          overflow: 'hidden',
          bgcolor: readOnly ? 'grey.50' : 'background.paper',
          transition: 'all 0.15s ease',
          '&:focus-within': readOnly
            ? undefined
            : {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.10)',
              },
        }}
      >
        {prefix ? <InputAffix side="prefix">{prefix}</InputAffix> : null}
        <InputBase
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          sx={{
            flex: 1,
            px: 1.25,
            py: 1,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            color: 'text.primary',
            bgcolor: 'transparent',
            cursor: readOnly ? 'default' : 'text',
            '& input': {
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              p: 0,
            },
          }}
        />
        {suffix ? <InputAffix side="suffix">{suffix}</InputAffix> : null}
      </Box>
    </Box>
  );
};

export default ExpenseRow;
