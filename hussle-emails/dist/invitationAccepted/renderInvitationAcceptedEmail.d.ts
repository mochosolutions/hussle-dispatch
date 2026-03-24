export interface InvitationAcceptedEmailData {
    inviteeName: string;
    inviteeEmail: string;
    orgName: string;
    role: string;
    teamSettingsUrl: string;
}
export declare const renderInvitationAcceptedEmail: (data: InvitationAcceptedEmailData) => Promise<{
    subject: string;
    html: string;
}>;
