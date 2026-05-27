// ==============================|| OVERRIDES - INPUT BASE ||============================== //

export default function InputBase() {
  return {
    MuiInputBase: {
      styleOverrides: {
        sizeSmall: {
          fontSize: '0.75rem',
        },
        root: {
          '&.Mui-disabled': {
            cursor: 'not-allowed',
          },
        },
      },
    },
  };
}
