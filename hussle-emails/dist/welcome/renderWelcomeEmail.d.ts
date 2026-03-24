export interface WelcomeEmailData {
    firstName: string;
    orgName: string;
    orgRole: 'CARRIER' | 'DISPATCH_COMPANY';
    dashboardUrl: string;
}
export declare const renderWelcomeEmail: (data: WelcomeEmailData) => Promise<{
    subject: string;
    html: string;
}>;
