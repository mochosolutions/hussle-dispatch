import { Theme } from '@mui/material/styles';
export default function ListItemButton(theme: Theme): {
    MuiListItemButton: {
        styleOverrides: {
            root: {
                '&.Mui-selected': {
                    color: string;
                    '& .MuiListItemIcon-root': {
                        color: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=ListItemButton.d.ts.map