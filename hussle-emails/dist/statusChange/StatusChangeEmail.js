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
const StatusChangeEmail = ({ loadNumber, fromStatus, toStatus, trackingUrl, }) => {
    const rows = [];
    if (fromStatus) {
        rows.push({ label: 'Previous Status', value: fromStatus });
    }
    rows.push({ label: 'New Status', value: toStatus, highlight: true });
    return ((0, jsx_runtime_1.jsxs)(EmailLayout_1.default, { preview: `Load ${loadNumber} status changed to ${toStatus}`, headerTitle: "Load Status Update", headerSubtitle: `Load ${loadNumber}`, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: emailStyles_1.textBody, children: "The status of your load has been updated." }), (0, jsx_runtime_1.jsx)(DataTable_1.default, { rows: rows }), trackingUrl ? (0, jsx_runtime_1.jsx)(CtaButton_1.default, { href: trackingUrl, children: "View live tracking" }) : null] }));
};
exports.default = StatusChangeEmail;
