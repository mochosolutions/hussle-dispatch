"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailLayout_1 = __importDefault(require("../layout/EmailLayout"));
const CtaButton_1 = __importDefault(require("../shared/CtaButton"));
const DataTable_1 = __importDefault(require("../shared/DataTable"));
const emailStyles_1 = require("../shared/emailStyles");
const CheckCallEmail = ({ loadNumber, location, status, eta, trackingUrl, }) => {
    const rows = [];
    if (location) {
        rows.push({ label: 'Location', value: location });
    }
    if (status) {
        rows.push({ label: 'Status', value: status });
    }
    if (eta) {
        rows.push({ label: 'ETA', value: eta });
    }
    return ((0, jsx_runtime_1.jsxs)(EmailLayout_1.default, { preview: `Check call update for Load ${loadNumber}`, headerTitle: "Check Call Update", headerSubtitle: `Load ${loadNumber}`, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: emailStyles_1.textBody, children: "Here is the latest check call update for your load." }), rows.length > 0 ? (0, jsx_runtime_1.jsx)(DataTable_1.default, { rows: rows }) : null, trackingUrl ? (0, jsx_runtime_1.jsx)(CtaButton_1.default, { href: trackingUrl, children: "View live tracking" }) : null] }));
};
exports.default = CheckCallEmail;
