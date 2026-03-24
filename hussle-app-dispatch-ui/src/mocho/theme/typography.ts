// material-ui
import {Theme, TypographyVariantsOptions} from '@mui/material/styles';

// types
import {FontFamily, ThemeMode} from '../types/config';

// ==============================|| DEFAULT THEME - TYPOGRAPHY  ||============================== //

const Typography = (
  mode: ThemeMode,
  fontFamily: FontFamily,
  _theme: Theme,
): TypographyVariantsOptions => ({
  htmlFontSize: 16,
  fontFamily,
  fontWeightLight:   300,
  fontWeightRegular: 400,
  fontWeightMedium:  500,
  fontWeightBold:    700,   // was 600 — now true bold

  // DISPLAY — entity IDs, large totals
  // Usage: Load numbers, invoice numbers, action bar amounts
  h1: {
    fontWeight:    800,
    fontSize:      '1.25rem',    // 20px
    lineHeight:    1,
    letterSpacing: '-0.02em',
  },

  // TITLE — page titles, modal titles, drawer titles
  // Usage: "Dispatch Board", EditDrawer title, modal title
  h2: {
    fontWeight:    700,
    fontSize:      '1.125rem',   // 18px
    lineHeight:    1.2,
    letterSpacing: '-0.02em',
  },

  // SUBTITLE — card headers, slide-over IDs, strip amounts
  // Usage: SectionCard titles, weekly gross fleet total
  h3: {
    fontWeight:    700,
    fontSize:      '0.9375rem',  // 15px
    lineHeight:    1.3,
    letterSpacing: '-0.01em',
  },

  // Not used for primary UI — kept for compatibility
  h4: {
    fontWeight: 600,
    fontSize:   '0.875rem',    // 14px
    lineHeight: 1.4,
  },
  h5: { fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 },
  h6: { fontWeight: 400, fontSize: '0.75rem',   lineHeight: 1.57 },

  // BODY — default reading text
  // Usage: Table cells, detail row labels/values, nav items, KPI values,
  //        banner text, form field values
  body1: {
    fontWeight: 400,
    fontSize:   '0.8125rem',   // 13px
    lineHeight: 1.5,
  },

  // CAPTION — sub-lines, timestamps, metadata
  // Usage: Secondary lines in two-line cells, file sizes, truck numbers,
  //        broker refs, activity log timestamps
  body2: {
    fontWeight: 400,
    fontSize:   '0.6875rem',   // 11px
    lineHeight: 1.4,
  },

  // LABEL — uppercase section/column/field labels ONLY
  // Usage: KPI labels "PICKUP", table headers "LOAD #",
  //        card labels "STOPS", form field labels "MONTHLY PAYMENT"
  overline: {
    fontWeight:    700,
    fontSize:      '0.625rem',   // 10px
    lineHeight:    1,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },

  caption: {
    fontWeight: 400,
    fontSize:   '0.625rem',    // 10px
    lineHeight: 1.4,
  },

  subtitle1: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.75rem',   fontWeight: 500, lineHeight: 1.57 },

  // BUTTON — never auto-capitalize
  button: {
    fontSize:      '0.8125rem',  // 13px
    fontWeight:    600,
    textTransform: 'none',       // was 'capitalize' — CHANGED
    lineHeight:    1.75,
  },
});

export default Typography;
