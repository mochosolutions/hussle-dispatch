import { Theme } from '@mui/material/styles';
export default function InputLabel(theme: Theme): {
    MuiInputLabel: {
        styleOverrides: {
            root: {
                color: string;
            };
            outlined: {
                lineHeight: string;
                '&.MuiInputLabel-sizeSmall': {
                    lineHeight: string;
                };
                '&.MuiInputLabel-shrink': {
                    background: string;
                    padding: string;
                    marginLeft: number;
                    lineHeight: string;
                };
            };
        };
    };
};
//# sourceMappingURL=InputLabel.d.ts.map