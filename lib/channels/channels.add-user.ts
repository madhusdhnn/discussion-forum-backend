import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { DEFAULT_ERROR_MESSAGE, ForbiddenRequestError, isAppError } from "../models/Errors";
import { Roles } from "../models/Users";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DynamoDB.DocumentClient();

type Participant = { name: string; userId: string };

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "Request body is null or empty" }, 400);
  }

  try {
    const channelId = event.pathParameters?.["channelId"] as string;
    const requestBody: Participant = JSON.parse(event.body);

    const groups = JSON.parse(event.requestContext.authorizer?.["groups"]) as string[];

    if (groups.filter((group) => group === Roles.SuperAdmin || group === Roles.Admin).length === 0) {
      throw new ForbiddenRequestError("Forbidden: (User not allowed to add member to the channel. Contact your admin)");
    }

    await ddb
      .update({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId },
        UpdateExpression: "SET #P = list_append(#P, :participants)",
        ExpressionAttributeNames: {
          "#P": "participants",
        },
        ExpressionAttributeValues: {
          ":participants": [{ isOwner: false, name: requestBody.name, userId: requestBody.userId }],
        },
      })
      .promise();

    return buildSuccessResult(null, 204);
  } catch (e: any) {
    console.error(e);
    if (isAppError(e)) {
      const { message, name } = e;
      return buildErrorResult({ message, name }, e.statusCode);
    }
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
