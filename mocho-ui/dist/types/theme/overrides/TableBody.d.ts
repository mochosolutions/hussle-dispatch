import { Theme } from '@mui/material/styles';
export default function TableBody(theme: Theme): {
    MuiTableBody: {
        styleOverrides: {
            root: {
                '&.striped .MuiTableRow-root': {
                    '&:hover': {
                        backgroundColor: string;
                    };
                    '&:nth-of-type(even)': {
                        backgroundColor: string;
                    };
                };
                '& .MuiTableRow-root': {
                    '&:hover': {
                        backgroundColor: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=TableBody.d.ts.map