import { Theme } from '@mui/material/styles';
export default function Badge(theme: Theme): {
    MuiBadge: {
        styleOverrides: {
            standard: {
                minWidth: string;
                height: string;
                padding: string;
            };
            light: {
                '&.MuiBadge-colorPrimary': {
                    color: string;
                    backgroundColor: string;
                };
                '&.MuiBadge-colorSecondary': {
                    color: string;
                    backgroundColor: string;
                };
                '&.MuiBadge-colorError': {
                    color: string;
                    backgroundColor: string;
                };
                '&.MuiBadge-colorInfo': {
                    color: string;
                    backgroundColor: string;
                };
                '&.MuiBadge-colorSuccess': {
                    color: string;
                    backgroundColor: string;
                };
                '&.MuiBadge-colorWarning': {
                    color: string;
                    backgroundColor: string;
                };
                color: string;
                backgroundColor: string;
            };
        };
    };
};
//# sourceMappingURL=Badge.d.ts.map