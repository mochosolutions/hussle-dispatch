"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailLayout_1 = __importDefault(require("../layout/EmailLayout"));
const CtaButton_1 = __importDefault(require("../shared/CtaButton"));
const emailStyles_1 = require("../shared/emailStyles");
const InvitationEmail = ({ inviterName, orgName, role, inviteUrl, expiresAt, }) => ((0, jsx_runtime_1.jsxs)(EmailLayout_1.default, { preview: `You've been invited to join ${orgName}`, headerTitle: "You're Invited!", headerSubtitle: orgName, children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { style: emailStyles_1.textBody, children: [(0, jsx_runtime_1.jsx)("strong", { children: inviterName }), " has invited you to join ", (0, jsx_runtime_1.jsx)("strong", { children: orgName }), " as a", ' ', (0, jsx_runtime_1.jsx)("strong", { children: role }), " on Hussle Dispatch."] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: emailStyles_1.textBody, children: "Click the button below to accept the invitation and set up your account." }), (0, jsx_runtime_1.jsx)(CtaButton_1.default, { href: inviteUrl, children: "Accept Invitation" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: expirationNote, children: ["This invitation expires on ", expiresAt, "."] })] }));
exports.default = InvitationEmail;
const expirationNote = {
    color: emailStyles_1.colors.grey500,
    fontSize: '12px',
    margin: '16px 0 0 0',
    textAlign: 'center',
};
