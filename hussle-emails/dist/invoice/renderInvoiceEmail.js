"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderInvoiceEmail = void 0;
const components_1 = require("@react-email/components");
const InvoiceEmail_1 = __importDefault(require("./InvoiceEmail"));
const renderInvoiceEmail = async (data) => ({
    subject: `Invoice ${data.invoiceNumber} from ${data.carrierName}`,
    html: await (0, components_1.render)((0, InvoiceEmail_1.default)(data)),
});
exports.renderInvoiceEmail = renderInvoiceEmail;
