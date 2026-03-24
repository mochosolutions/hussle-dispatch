"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailLayout_1 = __importDefault(require("../layout/EmailLayout"));
const DataTable_1 = __importDefault(require("../shared/DataTable"));
const emailStyles_1 = require("../shared/emailStyles");
const InvoiceEmail = ({ invoiceNumber, loadNumber, carrierName, totalAmount, dueDate, paymentTerms, replyToEmail, }) => ((0, jsx_runtime_1.jsxs)(EmailLayout_1.default, { preview: `Invoice ${invoiceNumber} for Load ${loadNumber} — ${totalAmount}`, headerTitle: `Invoice ${invoiceNumber}`, headerSubtitle: `Load ${loadNumber}`, children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { style: emailStyles_1.textBody, children: ["From ", (0, jsx_runtime_1.jsx)("strong", { children: carrierName }), " \u2014 please find your invoice details below. The invoice document is attached to this email."] }), (0, jsx_runtime_1.jsx)(DataTable_1.default, { rows: [
                { label: 'Total Amount', value: totalAmount },
                { label: 'Due Date', value: dueDate },
                { label: 'Payment Terms', value: paymentTerms },
            ] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: emailStyles_1.contactLine, children: ["Questions? Reply to", ' ', (0, jsx_runtime_1.jsx)(components_1.Link, { href: `mailto:${replyToEmail}`, style: emailStyles_1.inlineLink, children: replyToEmail })] })] }));
exports.default = InvoiceEmail;
