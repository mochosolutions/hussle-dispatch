import { Theme } from '@mui/material/styles';
export default function AccordionSummary(theme: Theme): {
    MuiAccordionSummary: {
        defaultProps: {
            expandIcon: import("@emotion/react/jsx-runtime").JSX.Element;
        };
        styleOverrides: {
            root: {
                backgroundColor: string;
                minHeight: number;
            };
            expandIconWrapper: {
                '&.Mui-expanded': {
                    transform: string;
                };
            };
            content: {
                marginTop: string;
                marginBottom: string;
                marginLeft: string;
            };
        };
    };
};
//# sourceMappingURL=AccordionSummary.d.ts.map