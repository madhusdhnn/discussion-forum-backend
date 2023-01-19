import { ValidationError } from "./Errors";

export const Roles = {
  SuperAdmin: "SUPER_ADMIN",
  Admin: "ADMIN",
  User: "USER",
} as const;

export type RoleStrings = typeof Roles[keyof typeof Roles];

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
  role: RoleStrings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISignInRequest {
  username: string;
  password: string;
}

export interface IUserRoleChangeRequest {
  userId: string;
  username: string;
  role: string;
}

export const parseRole = (roleStr: string): RoleStrings => {
  const result = Object.values(Roles).find((r) => roleStr && roleStr.toLowerCase() === r.toLowerCase());
  if (!result) {
    throw new ValidationError(`Invalid role value: ${roleStr}`);
  }
  return result;
};
