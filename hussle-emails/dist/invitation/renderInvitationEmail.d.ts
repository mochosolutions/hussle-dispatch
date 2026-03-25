export interface InvitationEmailData {
    inviteeName: string;
    inviterName: string;
    orgName: string;
    role: string;
    inviteUrl: string;
    expiresAt: string;
}
export declare const renderInvitationEmail: (data: InvitationEmailData) => Promise<{
    subject: string;
    html: string;
}>;
