import { Theme } from '@mui/material/styles';
export default function ToggleButton(theme: Theme): {
    MuiToggleButton: {
        styleOverrides: {
            root: {
                '&.Mui-disabled': {
                    borderColor: string;
                    color: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
        };
    };
};
//# sourceMappingURL=ToggleButton.d.ts.map