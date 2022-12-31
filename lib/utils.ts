import { APIGatewayProxyResult } from "aws-lambda";
import { randomBytes } from "crypto";
import { IChannel } from "./models/Channel";
import { VoteOpType } from "./models/Vote";

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

export const ensureChannelAccessForUser = (channel: IChannel, user: string) => {
  if (
    channel.visibility === "PRIVATE" &&
    !channel.participants.find((participant) => participant.name.toLowerCase() === user.toLowerCase())
  ) {
    throw new Error(`Access denied: (User - ${user} does not have access to the channel - ${channel.name})`);
  }
};

export const getVoteOperator = (voteOp: VoteOpType): string => {
  switch (voteOp) {
    case "UP":
      return "+";
    case "DOWN":
      return "-";
    default:
      throw new Error("Vote operation type is null or undefined");
  }
};
