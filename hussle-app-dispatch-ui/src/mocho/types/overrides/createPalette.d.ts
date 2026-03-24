import * as createPalette from '@mui/material/styles';

interface ColorScale {
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  1000: string;
}

declare module '@mui/material/styles' {
  interface SimplePaletteColorOptions {
    lighter?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
    1000?: string;
  }

  interface PaletteColor {
    lighter: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
    1000: string;
  }

  interface Palette {
    cyan: ColorScale;
    teal: ColorScale;
    indigo: ColorScale;
    orange: ColorScale;
    redVivid: ColorScale;
    yellowVivid: ColorScale;
    lightBlueVivid: ColorScale;
  }

  interface PaletteOptions {
    cyan?: ColorScale;
    teal?: ColorScale;
    indigo?: ColorScale;
    orange?: ColorScale;
    redVivid?: ColorScale;
    yellowVivid?: ColorScale;
    lightBlueVivid?: ColorScale;
  }
}
