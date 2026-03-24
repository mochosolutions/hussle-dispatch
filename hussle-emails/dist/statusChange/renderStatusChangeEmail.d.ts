export interface StatusChangeEmailData {
    loadNumber: string;
    fromStatus: string | null;
    toStatus: string;
    trackingUrl: string | null;
}
export declare const renderStatusChangeEmail: (data: StatusChangeEmailData) => Promise<{
    subject: string;
    html: string;
}>;
