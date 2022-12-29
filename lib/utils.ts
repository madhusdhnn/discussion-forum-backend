import { APIGatewayProxyResult } from "aws-lambda";
import { randomBytes } from "crypto";

export const buildSuccessResult = <T>(
  body: T | null | undefined = null,
  statusCode: number = 200
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "",
  };
};

export const buildErrorResult = (error: any = null, statusCode: number = 500): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: error ? JSON.stringify(error) : "",
  };
};

export const generateSecureRandomId = (size: number = 2, encoding: BufferEncoding = "hex"): string => {
  return randomBytes(size).toString(encoding);
};

export const toKey = (aString = ""): string => {
  const specialCharRegex = /[&\/\\#,+()$~%.'":*?<>{}]/g;
  return aString.replace(specialCharRegex, "").replace(/\s+/g, "-").toLowerCase();
};
