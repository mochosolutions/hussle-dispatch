import type { UserType, AttributeType } from '@aws-sdk/client-cognito-identity-provider';

export const formatCognitoUser = (user: UserType) => {
  const createdDate = user.UserCreateDate;
  const lastModifiedDate = user.UserLastModifiedDate;
  const status = user.UserStatus;
  const enabled = user.Enabled;
  const firstName = user.Attributes?.find((attr: AttributeType) => attr.Name === 'given_name')?.Value;
  const lastName = user.Attributes?.find((attr: AttributeType) => attr.Name === 'family_name')?.Value;
  const email = user.Attributes?.find((attr: AttributeType) => attr.Name === 'email')?.Value;
  const id = user.Attributes?.find((attr: AttributeType) => attr.Name === 'sub')?.Value;
  const tenantId = user.Attributes?.find((attr: AttributeType) => attr.Name === 'custom:tenantId')?.Value;
  const tenantTier = user.Attributes?.find((attr: AttributeType) => attr.Name === 'custom:tenantTier')?.Value;
  const userRole = user.Attributes?.find((attr: AttributeType) => attr.Name === 'custom:userRole')?.Value;

  return {
    id,
    email,
    firstName,
    lastName,
    tenantId,
    tenantTier,
    userRole,
    createdDate,
    lastModifiedDate,
    status,
    enabled,
  };
};
