export const Roles = {
  SuperAdmin: "SUPER_ADMIN",
  Admin: "ADMIN",
  User: "USER",
} as const;

export type RoleStrings = typeof Roles[keyof typeof Roles] | undefined;

export interface IUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface IConfirmUserRequest {
  email: string;
  confirmationCode: string;
}

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

export interface IUserResponse {
  userId: string;
  email: string;
  cognitoSub: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}
