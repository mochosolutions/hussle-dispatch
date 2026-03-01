import { Theme } from '@mui/material/styles';
export default function Slider(theme: Theme): {
    MuiSlider: {
        styleOverrides: {
            track: {
                height: string;
            };
            thumb: {
                width: number;
                height: number;
                border: string;
                backgroundColor: string;
                '&.MuiSlider-thumbColorPrimary': {
                    border: string;
                };
                '&.MuiSlider-thumbColorSecondary': {
                    border: string;
                };
                '&.MuiSlider-thumbColorSuccess': {
                    border: string;
                };
                '&.MuiSlider-thumbColorWarning': {
                    border: string;
                };
                '&.MuiSlider-thumbColorInfo': {
                    border: string;
                };
                '&.MuiSlider-thumbColorError': {
                    border: string;
                };
            };
            mark: {
                width: number;
                height: number;
                borderRadius: string;
                border: string;
                backgroundColor: string;
                '&.MuiSlider-markActive': {
                    opacity: number;
                    borderColor: string;
                    borderWidth: number;
                };
            };
            rail: {
                color: string;
            };
            root: {
                '&.Mui-disabled': {
                    '.MuiSlider-rail': {
                        opacity: number;
                    };
                    '.MuiSlider-track': {
                        color: string;
                    };
                    '.MuiSlider-thumb': {
                        border: string;
                    };
                };
            };
            valueLabel: {
                backgroundColor: string;
                color: string | undefined;
            };
        };
    };
};
//# sourceMappingURL=Slider.d.ts.map