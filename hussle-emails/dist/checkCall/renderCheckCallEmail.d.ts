export interface CheckCallEmailData {
    loadNumber: string;
    location: string | null;
    status: string | null;
    eta: string | null;
    trackingUrl: string | null;
}
export declare const renderCheckCallEmail: (data: CheckCallEmailData) => Promise<{
    subject: string;
    html: string;
}>;
