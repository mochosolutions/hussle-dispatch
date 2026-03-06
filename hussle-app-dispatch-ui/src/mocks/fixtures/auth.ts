export const mockUser = {
  id: 'user-001',
  email: 'admin@acmetrucking.com',
  firstName: 'Jane',
  lastName: 'Doe',
  organizationId: 'org-001',
};

export const mockOrg = {
  id: 'org-001',
  name: 'Acme Trucking Co.',
  role: 'BROKER',
};

export const mockLoginResponse = {
  status: 'authenticated',
  message: 'User authenticated successfully',
  user: mockUser,
  accessibleOrgs: [mockOrg],
};

export const mockMeResponse = {
  message: 'Current user fetched successfully',
  user: mockUser,
  accessibleOrgs: [mockOrg],
};
