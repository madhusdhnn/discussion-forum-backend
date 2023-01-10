import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IChannel, IChannelResponse } from "../models/Channel";
import { DEFAULT_ERROR_MESSAGE, isAppError } from "../models/Errors";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const channelId = event.pathParameters?.["channelId"];

    const result = await ddb
      .get({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId: channelId },
      })
      .promise();

    if (!result.Item) {
      return buildErrorResult(null, 404);
    }

    const channel = result.Item as IChannel;

    const response: IChannelResponse = {
      channelId: channel.channelId,
      name: channel.name,
      owner: channel.owner,
      visibility: channel.visibility,
      participants: channel.participants,
      totalQuestions: channel.totalQuestions,
      createdAt: new Date(channel.createdAt as number),
      updatedAt: new Date(channel.updatedAt as number),
    };

    return buildSuccessResult(response);
  } catch (e: any) {
    console.error(e);
    if (isAppError(e)) {
      const { message, name } = e;
      return buildErrorResult({ message, name }, e.statusCode);
    }
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
