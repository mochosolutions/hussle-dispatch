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
const InvitationAcceptedEmail = ({ inviteeName, inviteeEmail, orgName, role, teamSettingsUrl, }) => ((0, jsx_runtime_1.jsxs)(EmailLayout_1.default, { preview: `${inviteeName} has joined ${orgName}`, headerTitle: "New Team Member", headerSubtitle: orgName, children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { style: emailStyles_1.textBody, children: [(0, jsx_runtime_1.jsx)("strong", { children: inviteeName }), " has accepted the invitation and joined", ' ', (0, jsx_runtime_1.jsx)("strong", { children: orgName }), "."] }), (0, jsx_runtime_1.jsx)(DataTable_1.default, { rows: [
                { label: 'Name', value: inviteeName },
                { label: 'Email', value: inviteeEmail },
                { label: 'Role', value: role },
            ] }), (0, jsx_runtime_1.jsx)(CtaButton_1.default, { href: teamSettingsUrl, children: "View Team Settings" })] }));
exports.default = InvitationAcceptedEmail;
