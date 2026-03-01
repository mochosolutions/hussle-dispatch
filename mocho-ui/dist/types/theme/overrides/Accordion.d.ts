import { Theme } from '@mui/material/styles';
export default function Accordion(theme: Theme): {
    MuiAccordion: {
        defaultProps: {
            disableGutters: boolean;
            square: boolean;
            elevation: number;
        };
        styleOverrides: {
            root: {
                border: string;
                '&:not(:last-child)': {
                    borderBottom: number;
                };
                '&:before': {
                    display: string;
                };
                '&.Mui-disabled': {
                    backgroundColor: string;
                };
            };
        };
    };
};
//# sourceMappingURL=Accordion.d.ts.map