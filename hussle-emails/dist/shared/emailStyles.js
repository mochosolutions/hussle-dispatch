"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactLine = exports.inlineLink = exports.divider = exports.valueCell = exports.labelCell = exports.tableRow = exports.table = exports.textBody = exports.fontFamily = exports.colors = void 0;
// Brand colors — single source of truth matching Hussle Dispatch UI palette
exports.colors = {
    primary: '#0552B5',
    primaryDark: '#002159',
    primaryLight: '#BAE3FF',
    success: '#18981D',
    error: '#E12D39',
    white: '#FFFFFF',
    grey100: '#F5F7FA',
    grey200: '#E4E7EB',
    grey300: '#CBD2D9',
    grey400: '#9AA5B1',
    grey500: '#7B8794',
    grey600: '#616E7C',
    grey700: '#52606D',
    grey800: '#3E4C59',
    grey900: '#323F4B',
    grey1000: '#1F2933',
};
exports.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
exports.textBody = {
    color: exports.colors.grey900,
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
};
exports.table = {
    border: `1px solid ${exports.colors.grey200}`,
    borderRadius: '6px',
    overflow: 'hidden',
    width: '100%',
};
exports.tableRow = {
    width: '100%',
};
exports.labelCell = {
    color: exports.colors.grey600,
    fontSize: '13px',
    fontWeight: '600',
    padding: '12px 16px',
    textTransform: 'uppercase',
    width: '40%',
};
exports.valueCell = {
    color: exports.colors.grey900,
    fontSize: '15px',
    fontWeight: '500',
    padding: '12px 16px',
    textAlign: 'right',
};
exports.divider = {
    borderColor: exports.colors.grey200,
    margin: '0',
};
exports.inlineLink = {
    color: exports.colors.primary,
    textDecoration: 'underline',
};
exports.contactLine = {
    color: exports.colors.grey600,
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '24px 0 0 0',
};
