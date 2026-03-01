import { Theme } from '@mui/material/styles';
export default function TableCell(theme: Theme): {
    MuiTableCell: {
        styleOverrides: {
            root: {
                fontSize: string;
                padding: number;
                borderColor: string;
            };
            sizeSmall: {
                padding: number;
            };
            head: {
                '&:not(:last-of-type)': {
                    position: string;
                    '&:after': {
                        position: string;
                        content: string;
                        backgroundColor: string;
                        width: number;
                        height: string;
                        right: number;
                        top: number;
                    };
                };
                fontSize: string;
                fontWeight: number;
                textTransform: string;
            };
            footer: {
                '&:not(:last-of-type)': {
                    position: string;
                    '&:after': {
                        position: string;
                        content: string;
                        backgroundColor: string;
                        width: number;
                        height: string;
                        right: number;
                        top: number;
                    };
                };
                fontSize: string;
                textTransform: string;
            };
        };
    };
};
//# sourceMappingURL=TableCell.d.ts.map