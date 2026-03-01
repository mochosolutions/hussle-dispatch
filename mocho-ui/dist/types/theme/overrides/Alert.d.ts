import { Theme } from '@mui/material/styles';
export default function Alert(theme: Theme): {
    MuiAlert: {
        styleOverrides: {
            root: {
                color: string;
                fontSize: string;
            };
            icon: {
                fontSize: string;
            };
            message: {
                padding: number;
                marginTop: number;
            };
            filled: {
                color: string | undefined;
            };
            border: {
                '&.MuiAlert-borderPrimary': {
                    borderColor: string;
                    backgroundColor: string;
                    '& .MuiAlert-icon': {
                        color: string;
                    };
                };
                '&.MuiAlert-borderSecondary': {
                    borderColor: string;
                    backgroundColor: string;
                    '& .MuiAlert-icon': {
                        color: string;
                    };
                };
                '&.MuiAlert-borderError': {
                    borderColor: string;
                    backgroundColor: string;
                    '& .MuiAlert-icon': {
                        color: string;
                    };
                };
                '&.MuiAlert-borderSuccess': {
                    borderColor: string;
                    backgroundColor: string;
                    '& .MuiAlert-icon': {
                        color: string;
                    };
                };
                '&.MuiAlert-borderInfo': {
                    borderColor: string;
                    backgroundColor: string;
                    '& .MuiAlert-icon': {
                        color: string;
                    };
                };
                '&.MuiAlert-borderWarning': {
                    borderColor: string;
                    backgroundColor: string;
                    '& .MuiAlert-icon': {
                        color: string;
                    };
                };
                borderColor: string;
                backgroundColor: string;
                '& .MuiAlert-icon': {
                    color: string;
                };
                padding: string;
                border: string;
            };
            action: {
                '& .MuiButton-root': {
                    padding: number;
                    height: string;
                    fontSize: string;
                    marginTop: number;
                };
                '& .MuiIconButton-root': {
                    width: string;
                    height: string;
                    padding: number;
                    marginRight: number;
                    '& .MuiSvgIcon-root': {
                        fontSize: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=Alert.d.ts.map