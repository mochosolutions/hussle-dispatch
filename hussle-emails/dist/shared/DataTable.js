"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const emailStyles_1 = require("./emailStyles");
const highlightValueCell = {
    ...emailStyles_1.valueCell,
    color: emailStyles_1.colors.primary,
    fontWeight: '700',
};
const DataTable = ({ rows }) => ((0, jsx_runtime_1.jsx)(components_1.Section, { style: emailStyles_1.table, children: rows.map((row, index) => ((0, jsx_runtime_1.jsxs)("div", { children: [index > 0 ? (0, jsx_runtime_1.jsx)(components_1.Hr, { style: emailStyles_1.divider }) : null, (0, jsx_runtime_1.jsxs)(components_1.Row, { style: emailStyles_1.tableRow, children: [(0, jsx_runtime_1.jsx)(components_1.Column, { style: emailStyles_1.labelCell, children: row.label }), (0, jsx_runtime_1.jsx)(components_1.Column, { style: row.highlight ? highlightValueCell : emailStyles_1.valueCell, children: row.value })] })] }, row.label))) }));
exports.default = DataTable;
