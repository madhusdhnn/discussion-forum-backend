import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IChannelParticipants } from "../models/Channel";
import { DEFAULT_ERROR_MESSAGE } from "../models/Errors";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const channelId = event.pathParameters?.["channelId"];

    const result = await ddb
      .get({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId: channelId },
        ProjectionExpression: "participants",
      })
      .promise();

    if (!result.Item) {
      return buildErrorResult(null, 404);
    }

    const channelParticipants = result.Item as IChannelParticipants;
    return buildSuccessResult(channelParticipants.participants);
  } catch (e: any) {
    console.error(e);
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
