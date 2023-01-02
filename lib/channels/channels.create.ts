import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IChannel, IChannelRequest, IChannelSummaryResponse, parseChannelVisibility } from "../models/Channel";
import { buildErrorResult, buildSuccessResult, toKey } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  const channelRequest = JSON.parse(event.body) as IChannelRequest;
  const channelVisibility = parseChannelVisibility(channelRequest.visibility);

  if (channelRequest.name.length > 40) {
    throw new Error("Channel name can't be longer than 40 characters");
  }

  const channelId = toKey(channelRequest.name);

  try {
    const dbData: IChannel = {
      owner: channelRequest.owner,
      channelId: channelId,
      name: channelRequest.name,
      visibility: channelVisibility,
      totalQuestions: 0,
      participants: [{ isOwner: true, name: channelRequest.owner }],
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    };

    await ddb
      .put({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Item: dbData,
        ConditionExpression: "attribute_not_exists(channelId)",
      })
      .promise();

    const response: IChannelSummaryResponse = {
      channelId: dbData.channelId,
      name: dbData.name,
    };

    return buildSuccessResult(response, 201);
  } catch (e: any) {
    if (e.code && e.code === "ConditionalCheckFailedException") {
      return buildErrorResult(
        { message: `Channel already exists: (ChannelId: ${channelId}, Name: ${channelRequest.name})` },
        409
      );
    }
    return buildErrorResult({ message: e.message || "Something went wrong!" }, 500);
  }
};
