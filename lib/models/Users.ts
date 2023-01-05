export const Roles = {
  SuperAdmin: "SUPER_ADMIN",
  Admin: "ADMIN",
  Moderator: "MODERATOR",
  User: "USER",
} as const;

export type RoleStrings = typeof Roles[keyof typeof Roles];

export interface IUser {
  userId: string;
  role: RoleStrings;
  firstName: string;
  lastName: string;
  createdAt: number;
  updatedAt: number;
}
