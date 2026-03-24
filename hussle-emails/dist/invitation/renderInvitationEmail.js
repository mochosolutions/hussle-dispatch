"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderInvitationEmail = void 0;
const components_1 = require("@react-email/components");
const InvitationEmail_1 = __importDefault(require("./InvitationEmail"));
const renderInvitationEmail = async (data) => ({
    subject: `You've been invited to join ${data.orgName}`,
    html: await (0, components_1.render)((0, InvitationEmail_1.default)(data)),
});
exports.renderInvitationEmail = renderInvitationEmail;
