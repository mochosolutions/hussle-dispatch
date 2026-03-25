import { createTheme } from '@mui/material/styles';

import { ThemeMode } from '../types/config';

// ==============================|| TERTIARY COLOR SCALES ||============================== //
// Source: Refactoring UI Color Palettes v1.1.0

const cyan = {
  100: '#E0FCFF',
  200: '#BEF8FD',
  300: '#87EAF2',
  400: '#54D1DB',
  500: '#38BEC9',
  600: '#2CB1BC',
  700: '#14919B',
  800: '#0E7C86',
  900: '#0A6C74',
  1000: '#044E54',
};

const teal = {
  100: '#EFFCF6',
  200: '#C6F7E2',
  300: '#8EEDC7',
  400: '#65D6AD',
  500: '#3EBD93',
  600: '#27AB83',
  700: '#199473',
  800: '#147D64',
  900: '#0C6B58',
  1000: '#014D40',
};

const indigo = {
  100: '#E0E8F9',
  200: '#BED0F7',
  300: '#98AEEB',
  400: '#7B93DB',
  500: '#647ACB',
  600: '#4C63B6',
  700: '#4055A8',
  800: '#35469C',
  900: '#2D3A8C',
  1000: '#19216C',
};

const redVivid = {
  100: '#FFE3E3',
  200: '#FFBDBD',
  300: '#FF9B9B',
  400: '#F86A6A',
  500: '#EF4E4E',
  600: '#E12D39',
  700: '#CF1124',
  800: '#AB091E',
  900: '#8A041A',
  1000: '#610316',
};

const yellowVivid = {
  100: '#FFFBEA',
  200: '#FFF3C4',
  300: '#FCE588',
  400: '#FADB5F',
  500: '#F7C948',
  600: '#F0B429',
  700: '#DE911D',
  800: '#CB6E17',
  900: '#B44D12',
  1000: '#8D2B0B',
};

const orange = {
  100: '#FFEFE6',
  200: '#FFD3BA',
  300: '#FFB088',
  400: '#FF9466',
  500: '#F9703E',
  600: '#E65722',
  700: '#C44113',
  800: '#A3320E',
  900: '#83230A',
  1000: '#5C1606',
};

const lightBlueVivid = {
  100: '#E3F8FF',
  200: '#B3ECFF',
  300: '#81DEFD',
  400: '#5ED0FA',
  500: '#40C3F7',
  600: '#2BB0ED',
  700: '#1992D4',
  800: '#127FBF',
  900: '#0B69A3',
  1000: '#035388',
};

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
        1000: '#1F2933',
      },
      text: {
        primary: '#1F2933',
      },
      background: {
        default: '#E4E7EB',
        paper: '#fff',
      },
      // Drawer
      drawer: {
        headerBg: '#002159',
        headerText: '#ffffff',
      },
      // Tertiary color scales
      cyan,
      teal,
      indigo,
      orange,
      redVivid,
      yellowVivid,
      lightBlueVivid,
    },
  });

export default Palette;
