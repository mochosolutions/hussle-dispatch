export interface FormattedPointOfContact {
    fax: string;
    type: 'primary' | 'secondary';
    email: string;
    phone: string;
    title: string;
    fullName: string;
}
export interface FormattedPostedDate {
    postedDate: string;
    formattedPostedDate: string;
}
export interface Contract {
    active: boolean;
    pointOfContact: FormattedPointOfContact[];
    noticeId: string;
    title: string;
    solicitationNumber: string;
    fullParentPathName: string;
    fullParentPathCode: string;
    postedDate: string;
    type: string;
    baseType: string;
    archiveType: string;
    archiveDate: string;
    typeOfSetAsideDescription: string | null;
    typeOfSetAside: string | null;
    responseDeadLine: string;
    naicsCode: string;
    classificationCode: string;
    description: string;
    organizationType: string;
    officeAddress: any;
    placeOfPerformance: any;
    resourceLinks: string[] | [];
    uiLink: string | null;
    formattedPostedDate: FormattedPostedDate;
}
//# sourceMappingURL=contract.d.ts.map