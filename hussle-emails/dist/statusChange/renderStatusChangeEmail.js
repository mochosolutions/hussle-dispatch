"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderStatusChangeEmail = void 0;
const components_1 = require("@react-email/components");
const StatusChangeEmail_1 = __importDefault(require("./StatusChangeEmail"));
const renderStatusChangeEmail = async (data) => ({
    subject: `Load ${data.loadNumber} — Status changed to ${data.toStatus}`,
    html: await (0, components_1.render)((0, StatusChangeEmail_1.default)(data)),
});
exports.renderStatusChangeEmail = renderStatusChangeEmail;
