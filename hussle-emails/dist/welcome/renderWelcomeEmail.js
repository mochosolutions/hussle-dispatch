"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWelcomeEmail = void 0;
const components_1 = require("@react-email/components");
const WelcomeEmail_1 = __importDefault(require("./WelcomeEmail"));
const renderWelcomeEmail = async (data) => ({
    subject: `Welcome to Hussle Dispatch, ${data.firstName}!`,
    html: await (0, components_1.render)((0, WelcomeEmail_1.default)(data)),
});
exports.renderWelcomeEmail = renderWelcomeEmail;
