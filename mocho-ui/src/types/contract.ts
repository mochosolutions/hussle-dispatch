// Todo maybe conveert active to boolean
// Todo check if award ever has any value

interface PointOfContact {
  fax: string | null;
  type: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  fullName: string | null;
}

interface OfficeAddress {
  zipcode: string | null;
  city: string | null;
  countryCode: string | null;
  state: string | null;
}

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
