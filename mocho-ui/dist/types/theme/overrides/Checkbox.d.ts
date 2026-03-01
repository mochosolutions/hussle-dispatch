import { Theme } from '@mui/material/styles';
export default function Checkbox(theme: Theme): {
    MuiCheckbox: {
        defaultProps: {
            className: string;
            icon: import("@emotion/react/jsx-runtime").JSX.Element;
            checkedIcon: import("@emotion/react/jsx-runtime").JSX.Element;
            indeterminateIcon: import("@emotion/react/jsx-runtime").JSX.Element;
        };
        styleOverrides: {
            root: {
                borderRadius: number;
                color: string | undefined;
                '&.size-small': {
                    '& .icon': {
                        width: number;
                        height: number;
                        '& .filled': {
                            fontSize: string;
                            top: number;
                            left: number;
                        };
                    };
                };
                '&.size-medium': {
                    '& .icon': {
                        width: number;
                        height: number;
                        '& .filled': {
                            fontSize: string;
                            top: number;
                            left: number;
                        };
                    };
                };
                '&.size-large': {
                    '& .icon': {
                        width: number;
                        height: number;
                        '& .filled': {
                            fontSize: string;
                            top: number;
                            left: number;
                        };
                    };
                };
            };
            colorPrimary: {
                '&:hover': {
                    backgroundColor: string;
                    '& .icon': {
                        borderColor: string;
                    };
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorSecondary: {
                '&:hover': {
                    backgroundColor: string;
                    '& .icon': {
                        borderColor: string;
                    };
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorSuccess: {
                '&:hover': {
                    backgroundColor: string;
                    '& .icon': {
                        borderColor: string;
                    };
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorWarning: {
                '&:hover': {
                    backgroundColor: string;
                    '& .icon': {
                        borderColor: string;
                    };
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorInfo: {
                '&:hover': {
                    backgroundColor: string;
                    '& .icon': {
                        borderColor: string;
                    };
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
            colorError: {
                '&:hover': {
                    backgroundColor: string;
                    '& .icon': {
                        borderColor: string;
                    };
                };
                '&.Mui-focusVisible': {
                    outline: string;
                    outlineOffset: number;
                };
            };
        };
    };
};
//# sourceMappingURL=Checkbox.d.ts.map