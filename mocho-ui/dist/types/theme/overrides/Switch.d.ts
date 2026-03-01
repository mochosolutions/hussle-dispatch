import { Theme } from '@mui/material/styles';
export default function Switch(theme: Theme): {
    MuiSwitch: {
        styleOverrides: {
            track: {
                opacity: number;
                backgroundColor: string | undefined;
                boxSizing: string;
            };
            thumb: {
                borderRadius: string;
                transition: string;
            };
            switchBase: {
                '&.Mui-checked': {
                    color: string;
                    '& + .MuiSwitch-track': {
                        opacity: number;
                    };
                    '&.Mui-disabled': {
                        color: string;
                    };
                };
                '&.Mui-disabled': {
                    color: string;
                    '+.MuiSwitch-track': {
                        opacity: number;
                    };
                };
            };
            root: {
                width: number;
                height: number;
                '& .MuiSwitch-switchBase': {
                    padding: number;
                    '&.Mui-checked': {
                        transform: string;
                    };
                };
                '& .MuiSwitch-thumb': {
                    width: number;
                    height: number;
                };
                '& .MuiSwitch-track': {
                    borderRadius: number;
                };
                color: string;
                padding: number;
                margin: number;
                display: string;
                '& ~ .MuiFormControlLabel-label': {
                    margin: number;
                };
            };
            sizeLarge: {
                width: number;
                height: number;
                '& .MuiSwitch-switchBase': {
                    padding: number;
                    '&.Mui-checked': {
                        transform: string;
                    };
                };
                '& .MuiSwitch-thumb': {
                    width: number;
                    height: number;
                };
                '& .MuiSwitch-track': {
                    borderRadius: number;
                };
            };
            sizeSmall: {
                width: number;
                height: number;
                '& .MuiSwitch-switchBase': {
                    padding: number;
                    '&.Mui-checked': {
                        transform: string;
                    };
                };
                '& .MuiSwitch-thumb': {
                    width: number;
                    height: number;
                };
                '& .MuiSwitch-track': {
                    borderRadius: number;
                };
            };
        };
    };
};
//# sourceMappingURL=Switch.d.ts.map