import {ReactElement} from 'react';

export type GuardProps = {
  children: ReactElement | null;
};

export type Platform = {
  name: string;
  apiKeys: {
    key: string;
    value: string;
  }[];
};

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type Token = {
  accessToken: string;
  idToken: string;
};

export interface JWTDataProps {
  userId: string;
}

export interface CDWConfig {
  cdwTokenKey: string;
  cdwTokenValue: string;
  cdwCustomerID: string;
  cdwBasicAuthToken: string;
}
