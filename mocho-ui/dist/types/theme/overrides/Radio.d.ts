import { Theme } from '@mui/material/styles';
export default function Radio(theme: Theme): {
    MuiRadio: {
        defaultProps: {
            className: string;
            icon: import("@emotion/react/jsx-runtime").JSX.Element;
            checkedIcon: import("@emotion/react/jsx-runtime").JSX.Element;
        };
        styleOverrides: {
            root: {
                color: string | undefined;
                '&.size-small': {
                    '& .icon': {
                        width: number;
                        height: number;
                        '& .dot': {
                            width: number;
                            height: number;
                            top: number;
                            left: number;
                        };
                    };
                };
                '&.size-medium': {
                    '& .icon': {
                        width: number;
                        height: number;
                        '& .dot': {
                            width: number;
                            height: number;
                            top: number;
                            left: number;
                        };
                    };
                };
                '&.size-large': {
                    '& .icon': {
                        width: number;
                        height: number;
                        '& .dot': {
                            width: number;
                            height: number;
                            top: number;
                            left: number;
                        };
                    };
                };
            };
            colorPrimary: {
                '& .dot': {
                    backgroundColor: string;
                };
                '&:hover': {
                    backgroundColor: string;
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorSecondary: {
                '& .dot': {
                    backgroundColor: string;
                };
                '&:hover': {
                    backgroundColor: string;
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorSuccess: {
                '& .dot': {
                    backgroundColor: string;
                };
                '&:hover': {
                    backgroundColor: string;
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorWarning: {
                '& .dot': {
                    backgroundColor: string;
                };
                '&:hover': {
                    backgroundColor: string;
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorInfo: {
                '& .dot': {
                    backgroundColor: string;
                };
                '&:hover': {
                    backgroundColor: string;
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorError: {
                '& .dot': {
                    backgroundColor: string;
                };
                '&:hover': {
                    backgroundColor: string;
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
        };
    };
};
//# sourceMappingURL=Radio.d.ts.map