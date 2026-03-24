"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const emailStyles_1 = require("./emailStyles");
const buttonStyle = {
    backgroundColor: emailStyles_1.colors.primary,
    borderRadius: '6px',
    color: emailStyles_1.colors.white,
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    padding: '10px 24px',
    textDecoration: 'none',
};
const wrapper = {
    margin: '24px 0 0 0',
    textAlign: 'center',
};
const CtaButton = ({ href, children }) => ((0, jsx_runtime_1.jsx)(components_1.Text, { style: wrapper, children: (0, jsx_runtime_1.jsx)(components_1.Link, { href: href, style: buttonStyle, children: children }) }));
exports.default = CtaButton;
