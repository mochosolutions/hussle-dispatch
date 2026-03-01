export default function TableRow(): {
    MuiTableRow: {
        styleOverrides: {
            root: {
                '&:last-of-type': {
                    '& .MuiTableCell-root': {
                        borderBottom: string;
                    };
                };
                '& .MuiTableCell-root': {
                    '&:last-of-type': {
                        paddingRight: number;
                    };
                    '&:first-of-type': {
                        paddingLeft: number;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=TableRow.d.ts.map