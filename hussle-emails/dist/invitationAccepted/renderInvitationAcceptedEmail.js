"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderInvitationAcceptedEmail = void 0;
const components_1 = require("@react-email/components");
const InvitationAcceptedEmail_1 = __importDefault(require("./InvitationAcceptedEmail"));
const renderInvitationAcceptedEmail = async (data) => ({
    subject: `${data.inviteeName} has joined ${data.orgName}`,
    html: await (0, components_1.render)((0, InvitationAcceptedEmail_1.default)(data)),
});
exports.renderInvitationAcceptedEmail = renderInvitationAcceptedEmail;
