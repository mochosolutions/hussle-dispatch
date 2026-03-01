import { Theme } from '@mui/material/styles';
export default function Tab(theme: Theme): {
    MuiTab: {
        styleOverrides: {
            root: {
                minHeight: number;
                color: string;
                borderRadius: number;
                '&:hover': {
                    backgroundColor: string;
                    color: string;
                };
                '&:focus-visible': {
                    borderRadius: number;
                    outline: string;
                    outlineOffset: number;
                };
            };
        };
    };
};
//# sourceMappingURL=Tab.d.ts.map