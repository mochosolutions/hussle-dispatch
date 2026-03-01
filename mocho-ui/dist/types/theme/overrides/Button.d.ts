import { Theme } from '@mui/material/styles';
export default function Button(theme: Theme): {
    MuiButton: {
        defaultProps: {
            disableElevation: boolean;
        };
        styleOverrides: {
            root: {
                fontWeight: number;
                '&::after': {
                    content: string;
                    display: string;
                    position: string;
                    left: number;
                    top: number;
                    width: string;
                    height: string;
                    borderRadius: number;
                    opacity: number;
                    transition: string;
                };
                '&:active::after': {
                    position: string;
                    borderRadius: number;
                    left: number;
                    top: number;
                    opacity: number;
                    transition: string;
                };
            };
            contained: {
                '&.Mui-disabled': {
                    backgroundColor: string;
                };
            };
            outlined: {
                '&.Mui-disabled': {
                    backgroundColor: string;
                };
            };
            text: {
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                };
            };
            endIcon: {
                '&>*:nth-of-type(1)': {
                    fontSize: string;
                };
            };
            startIcon: {
                '&>*:nth-of-type(1)': {
                    fontSize: string;
                };
            };
            dashed: {
                '&.MuiButton-dashedPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
                border: string;
            } | {
                '&.MuiButton-dashedPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
                border: string;
            } | {
                '&.MuiButton-dashedPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
                border: string;
            } | {
                '&.MuiButton-dashedPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
                border: string;
            } | {
                '&.MuiButton-dashedPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-dashedWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
                border: string;
            };
            shadow: {
                '&.MuiButton-shadowPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&.MuiButton-shadowPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&.MuiButton-shadowPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&.MuiButton-shadowPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&.MuiButton-shadowPrimary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSecondary': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowError': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowSuccess': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowInfo': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.MuiButton-shadowWarning': {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        backgroundColor: string;
                        boxShadow?: undefined;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    backgroundColor: string;
                    boxShadow: string;
                    '&:hover': {
                        boxShadow: string;
                        backgroundColor: string;
                        color?: undefined;
                        borderColor?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    borderColor: string;
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        borderColor: string;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                    '&:hover': {
                        color: string;
                        borderColor: string;
                        backgroundColor?: undefined;
                        boxShadow?: undefined;
                    };
                } | {
                    '&::after': {
                        boxShadow: string;
                    };
                    '&:active::after': {
                        boxShadow: string;
                    };
                    '&:focus-visible': {
                        outline: string;
                        outlineOffset: number;
                    };
                    '&:hover': {
                        color: string;
                        backgroundColor: string;
                        boxShadow?: undefined;
                        borderColor?: undefined;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                };
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            containedPrimary: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            containedSecondary: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            containedError: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            containedSuccess: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            containedInfo: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            containedWarning: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            outlinedPrimary: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            outlinedSecondary: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            outlinedError: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            outlinedSuccess: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            outlinedInfo: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            outlinedWarning: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            textPrimary: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            textSecondary: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            textError: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            textSuccess: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            textInfo: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            textWarning: {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    backgroundColor: string;
                    boxShadow?: undefined;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                backgroundColor: string;
                boxShadow: string;
                '&:hover': {
                    boxShadow: string;
                    backgroundColor: string;
                    color?: undefined;
                    borderColor?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                borderColor: string;
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    borderColor: string;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                color: string;
                borderColor: string;
                backgroundColor: string;
                '&:hover': {
                    color: string;
                    borderColor: string;
                    backgroundColor?: undefined;
                    boxShadow?: undefined;
                };
            } | {
                '&::after': {
                    boxShadow: string;
                };
                '&:active::after': {
                    boxShadow: string;
                };
                '&:focus-visible': {
                    outline: string;
                    outlineOffset: number;
                };
                '&:hover': {
                    color: string;
                    backgroundColor: string;
                    boxShadow?: undefined;
                    borderColor?: undefined;
                };
            };
            sizeExtraSmall: {
                minWidth: number;
                fontSize: string;
                padding: string;
            };
        };
    };
};
//# sourceMappingURL=Button.d.ts.map