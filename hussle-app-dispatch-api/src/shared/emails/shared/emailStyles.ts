// Brand colors — single source of truth matching Hussle Dispatch UI palette
export const colors = {
  primary: '#0552B5',
  primaryDark: '#002159',
  primaryLight: '#BAE3FF',
  success: '#18981D',
  error: '#E12D39',
  white: '#FFFFFF',
  grey100: '#F5F7FA',
  grey200: '#E4E7EB',
  grey300: '#CBD2D9',
  grey400: '#9AA5B1',
  grey500: '#7B8794',
  grey600: '#616E7C',
  grey700: '#52606D',
  grey800: '#3E4C59',
  grey900: '#323F4B',
  grey1000: '#1F2933',
} as const;

export const fontFamily =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const textBody: React.CSSProperties = {
  color: colors.grey900,
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

export const table: React.CSSProperties = {
  border: `1px solid ${colors.grey200}`,
  borderRadius: '6px',
  overflow: 'hidden',
  width: '100%',
};

export const tableRow: React.CSSProperties = {
  width: '100%',
};

export const labelCell: React.CSSProperties = {
  color: colors.grey600,
  fontSize: '13px',
  fontWeight: '600',
  padding: '12px 16px',
  textTransform: 'uppercase' as const,
  width: '40%',
};

export const valueCell: React.CSSProperties = {
  color: colors.grey900,
  fontSize: '15px',
  fontWeight: '500',
  padding: '12px 16px',
  textAlign: 'right' as const,
};

export const divider: React.CSSProperties = {
  borderColor: colors.grey200,
  margin: '0',
};

export const inlineLink: React.CSSProperties = {
  color: colors.primary,
  textDecoration: 'underline',
};

export const contactLine: React.CSSProperties = {
  color: colors.grey600,
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '24px 0 0 0',
};
