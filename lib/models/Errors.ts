export const DEFAULT_ERROR_MESSAGE = "Something went wrong";

export const ErrorType = {
  Client: "CLIENT",
  Server: "SERVER",
} as const;

export type ErrorTypeStrings = typeof ErrorType[keyof typeof ErrorType];

export abstract class AppError extends Error {
  abstract readonly errorType: ErrorTypeStrings;
  abstract readonly statusCode: number;
}

export const isAppError = (error: any): error is AppError => {
  return error.errorType !== undefined;
};

export class ValidationError extends AppError {
  readonly statusCode: number = 400;
  readonly errorType: ErrorTypeStrings = ErrorType.Client;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "ValidationError";
  }
}

export class PropertyRequiredError extends AppError {
  readonly statusCode: number = 400;
  readonly errorType: ErrorTypeStrings = ErrorType.Client;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "PropertyRequiredError";
  }
}

export class IllegalArgumentError extends AppError {
  readonly statusCode: number = 500;
  readonly errorType: ErrorTypeStrings = ErrorType.Server;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "IllegalArgumentError";
  }
}

export class BadRequestError extends AppError {
  readonly statusCode: number = 400;
  readonly errorType: ErrorTypeStrings = ErrorType.Client;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ForbiddenRequestError extends AppError {
  readonly statusCode: number = 403;
  readonly errorType: ErrorTypeStrings = ErrorType.Client;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "ForbiddenRequestError";
  }
}

export class ConflictError extends AppError {
  readonly statusCode: number = 409;
  readonly errorType: ErrorTypeStrings = ErrorType.Client;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends AppError {
  readonly statusCode: number = 404;
  readonly errorType: ErrorTypeStrings = ErrorType.Client;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class EntityNotEmptyError extends AppError {
  readonly statusCode: number = 500;
  readonly errorType: ErrorTypeStrings = ErrorType.Server;

  constructor(message: string = DEFAULT_ERROR_MESSAGE) {
    super(message);
    this.name = "EntityNotEmptyError";
  }
}
