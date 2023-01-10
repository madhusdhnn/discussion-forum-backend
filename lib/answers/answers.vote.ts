import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IAnswerVoteRequest } from "../models/Answer";
import { IChannel } from "../models/Channel";
import { DEFAULT_ERROR_MESSAGE, isAppError, NotFoundError } from "../models/Errors";
import { parseVoteOp } from "../models/Vote";
import { buildErrorResult, buildSuccessResult, ensureChannelAccessForUser, getVoteOperator } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  try {
    const requestBody = JSON.parse(event.body) as IAnswerVoteRequest;
    const answerId = event.pathParameters?.["answerId"];

    const getChannelResult = await ddb
      .get({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId: requestBody.channelId },
      })
      .promise();

    const channel = getChannelResult.Item as IChannel;

    if (!channel) {
      throw new NotFoundError(`No channel found: (Channel ID: ${requestBody.channelId})`);
    }

    ensureChannelAccessForUser(channel, requestBody.voter);

    const voteOp = parseVoteOp(requestBody.operation);

    await ddb
      .update({
        TableName: process.env.ANSWERS_TABLE_NAME as string,
        Key: { questionId: requestBody.questionId, answerId: answerId },
        UpdateExpression: "SET totalVotes = totalVotes " + getVoteOperator(voteOp) + " :value, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":value": 1,
          ":updatedAt": new Date().getTime(),
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
