"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderCheckCallEmail = void 0;
const components_1 = require("@react-email/components");
const CheckCallEmail_1 = __importDefault(require("./CheckCallEmail"));
const renderCheckCallEmail = async (data) => ({
    subject: `Check Call — Load ${data.loadNumber}`,
    html: await (0, components_1.render)((0, CheckCallEmail_1.default)(data)),
});
exports.renderCheckCallEmail = renderCheckCallEmail;
