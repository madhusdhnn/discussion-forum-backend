import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { IChannel } from "../models/Channel";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DynamoDB.DocumentClient();

type ParticipantName = { name: string };

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "Request body is null or empty" }, 400);
  }

  try {
    const channelId = event.pathParameters?.["channelId"] as string;
    const requestBody: ParticipantName = JSON.parse(event.body);

    // TODO: allow further only if admin. Admin is about the Role

    await ddb
      .update({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId },
        UpdateExpression: "SET #P = list_append(#P, :participants)",
        ExpressionAttributeNames: {
          "#P": "participants",
        },
        ExpressionAttributeValues: {
          ":participants": [{ isOwner: false, name: requestBody.name }],
        },
      })
      .promise();

    return buildSuccessResult(null, 204);
  } catch (e: any) {
    return buildErrorResult({ message: e.message || "Something went wrong!" }, 500);
  }
};
