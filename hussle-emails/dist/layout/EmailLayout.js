"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const emailStyles_1 = require("../shared/emailStyles");
const EmailLayout = ({ preview, headerTitle, headerSubtitle, children }) => ((0, jsx_runtime_1.jsxs)(components_1.Html, { children: [(0, jsx_runtime_1.jsx)(components_1.Head, { children: (0, jsx_runtime_1.jsx)(components_1.Font, { fontFamily: "Plus Jakarta Sans", fallbackFontFamily: ['Helvetica', 'Arial', 'sans-serif'], webFont: {
                    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
                    format: 'woff2',
                }, fontWeight: 400, fontStyle: "normal" }) }), (0, jsx_runtime_1.jsx)(components_1.Preview, { children: preview }), (0, jsx_runtime_1.jsx)(components_1.Body, { style: body, children: (0, jsx_runtime_1.jsxs)(components_1.Container, { style: container, children: [(0, jsx_runtime_1.jsxs)(components_1.Section, { style: header, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: headerTitleStyle, children: headerTitle }), headerSubtitle ? (0, jsx_runtime_1.jsx)(components_1.Text, { style: headerSubtitleStyle, children: headerSubtitle }) : null] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: content, children: children }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: footer, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: footerText, children: "Sent via Hussle Dispatch" }) })] }) })] }));
exports.default = EmailLayout;
const body = {
    backgroundColor: emailStyles_1.colors.grey100,
    fontFamily: emailStyles_1.fontFamily,
    margin: '0',
    padding: '40px 0',
};
const container = {
    backgroundColor: emailStyles_1.colors.white,
    borderRadius: '8px',
    margin: '0 auto',
    maxWidth: '600px',
    overflow: 'hidden',
};
const header = {
    backgroundColor: emailStyles_1.colors.primaryDark,
    padding: '32px 40px',
};
const headerTitleStyle = {
    color: emailStyles_1.colors.white,
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '1.3',
    margin: '0',
};
const headerSubtitleStyle = {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.4',
    margin: '8px 0 0 0',
};
const content = {
    padding: '32px 40px',
};
const footer = {
    backgroundColor: emailStyles_1.colors.grey100,
    borderTop: `1px solid ${emailStyles_1.colors.grey200}`,
    padding: '20px 40px',
};
const footerText = {
    color: emailStyles_1.colors.grey400,
    fontSize: '12px',
    margin: '0',
    textAlign: 'center',
};
