export const Roles = {
  SuperAdmin: "SUPER_ADMIN",
  Admin: "ADMIN",
  User: "USER",
} as const;

export type RoleStrings = typeof Roles[keyof typeof Roles] | undefined;

export interface IUser {
  userId: string;
  email: string;
  cognitoSub: string;
  role: RoleStrings;
  firstName: string;
  lastName: string;
  createdAt: number;
  updatedAt: number;
}
