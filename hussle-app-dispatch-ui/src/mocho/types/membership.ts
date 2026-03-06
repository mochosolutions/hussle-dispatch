// export interface Membership {
//   id: string;
//   orgId: string;
//   userId: string;
//   role: string;
//   // Add other fields as needed based on API response
// }

export interface Membership {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  externalId: string;
  role: string;
  status: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
