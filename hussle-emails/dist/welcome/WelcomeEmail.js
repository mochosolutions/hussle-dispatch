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
const carrierSteps = [
    'Add your vehicles and equipment',
    'Invite your team members',
    'Accept and manage loads from your dispatchers',
];
const dispatchSteps = [
    'Add carriers to your network',
    'Create and dispatch loads',
    'Invite your team members',
];
const WelcomeEmail = ({ firstName, orgName, orgRole, dashboardUrl }) => {
    const steps = orgRole === 'CARRIER' ? carrierSteps : dispatchSteps;
    return ((0, jsx_runtime_1.jsxs)(EmailLayout_1.default, { preview: `Welcome to Hussle Dispatch, ${firstName}!`, headerTitle: `Welcome to Hussle Dispatch!`, headerSubtitle: orgName, children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { style: emailStyles_1.textBody, children: ["Hi ", firstName, ", your organization ", (0, jsx_runtime_1.jsx)("strong", { children: orgName }), " is all set up and ready to go."] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: emailStyles_1.textBody, children: "Here are some next steps to get started:" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: listStyle, children: steps.map((step, index) => ((0, jsx_runtime_1.jsxs)("span", { children: [index + 1, ". ", step, (0, jsx_runtime_1.jsx)("br", {})] }, step))) }), (0, jsx_runtime_1.jsx)(CtaButton_1.default, { href: dashboardUrl, children: "Go to Dashboard" })] }));
};
exports.default = WelcomeEmail;
const listStyle = {
    ...emailStyles_1.textBody,
    paddingLeft: '8px',
};
