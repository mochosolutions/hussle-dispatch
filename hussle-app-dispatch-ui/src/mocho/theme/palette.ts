import { createTheme } from '@mui/material/styles';

import { ThemeMode } from '../types/config';

// ==============================|| DEFAULT THEME - PALETTE  ||============================== //

const Palette = (mode: ThemeMode) =>
  createTheme({
    palette: {
      mode,
      common: {
        black: '#000',
        white: '#fff',
      },
      primary: {
        lighter: '#E6F6FF',
        light: '#BAE3FF',
        main: '#0552B5',
        dark: '#002159',
        contrastText: '#fff',
        100: '#E6F6FF',
        200: '#BAE3FF',
        300: '#7CC4FA',
        400: '#47A3F3',
        500: '#2186EB',
        600: '#0967D2',
        700: '#0552B5',
        800: '#03449E',
        900: '#01337D',
        1000: '#002159',
      },
      secondary: {
        lighter: '#E3F9E5',
        light: '#91E697',
        main: '#18981D',
        dark: '#0F8613',
        contrastText: '#fff',
        100: '#E3F9E5',
        200: '#C1F2C7',
        300: '#91E697',
        400: '#51CA58',
        500: '#31B237',
        600: '#18981D',
        700: '#0F8613',
        800: '#0E7817',
        900: '#07600E',
        1000: '#014807',
      },
      grey: {
        100: '#F5F7FA',
        200: '#E4E7EB',
        300: '#CBD2D9',
        400: '#9AA5B1',
        500: '#7B8794',
        600: '#616E7C',
        700: '#52606D',
        800: '#3E4C59',
        900: '#323F4B',
      },
      text: {
        primary: '#1F2933',
      },
      background: {
        default: '#F5F7FA',
        paper: '#fff',
      },
    },
  });

export default Palette;
