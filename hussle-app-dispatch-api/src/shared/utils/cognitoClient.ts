import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

export const cognitoIdentityClient = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});
