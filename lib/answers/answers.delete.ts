import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IDeleteAnswerRequest } from "../models/Answer";
import { IChannel } from "../models/Channel";
import { DEFAULT_ERROR_MESSAGE, NotFoundError } from "../models/Errors";
import { buildErrorResult, buildSuccessResult, ensureChannelAccessForUser } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  const { channelId, questionId, requestedBy } = JSON.parse(event.body) as IDeleteAnswerRequest;
  try {
    const answerId = event.pathParameters?.["answerId"];
    const getChannelResult = await ddb
      .get({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId },
      })
      .promise();

    if (!getChannelResult.Item) {
      throw new NotFoundError(`No channel found: (Channel ID: ${channelId})`);
    }

    const channel = getChannelResult.Item as IChannel;
    ensureChannelAccessForUser(channel, requestedBy);

    await ddb
      .delete({
        TableName: process.env.ANSWERS_TABLE_NAME as string,
        Key: { questionId, answerId },
        ConditionExpression: "postedBy = :requestedBy",
        ExpressionAttributeValues: {
          ":requestedBy": requestedBy,
        },
      })
      .promise();
    return buildSuccessResult(null, 204);
  } catch (e: any) {
    console.error(e);
    if (e.code && e.code === "ConditionalCheckFailedException") {
      return buildErrorResult({ message: `Access Denied: (User: ${requestedBy} is not the owner of the answer)` }, 403);
    }
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
