export const formatCognitoUser = (user: any) => {
  const createdDate = user.UserCreateDate;
  const lastModifiedDate = user.UserLastModifiedDate;
  const status = user.UserStatus;
  const enabled = user.Enabled;
  const firstName = user.Attributes?.find((attr: any) => attr.Name === 'given_name')?.Value;
  const lastName = user.Attributes?.find((attr: any) => attr.Name === 'family_name')?.Value;
  const email = user.Attributes?.find((attr: any) => attr.Name === 'email')?.Value;
  const id = user.Attributes?.find((attr: any) => attr.Name === 'sub')?.Value;
  const tenantId = user.Attributes?.find((attr: any) => attr.Name === 'custom:tenantId')?.Value;
  const tenantTier = user.Attributes?.find((attr: any) => attr.Name === 'custom:tenantTier')?.Value;
  const userRole = user.Attributes?.find((attr: any) => attr.Name === 'custom:userRole')?.Value;

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
