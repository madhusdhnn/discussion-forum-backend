import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IChannel } from "../models/Channel";
import { IAnswerVoteRequest } from "../models/Answer";
import { buildErrorResult, buildSuccessResult, ensureChannelAccessForUser, getVoteOperator } from "../utils";
import { parseVoteOp } from "../models/Vote";

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
      throw new Error(`No channel found: (Channel ID: ${requestBody.channelId})`);
    }

    ensureChannelAccessForUser(channel, requestBody.voter);

    const voteOp = parseVoteOp(requestBody.operation);

    await ddb
      .update({
        TableName: process.env.ANSWERS_TABLE_NAME as string,
        Key: { questionId: requestBody.questionId, answerId: answerId },
        UpdateExpression: "SET voteCount = voteCount " + getVoteOperator(voteOp) + " :value, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":value": 1,
          ":updatedAt": new Date().getTime(),
        },
      })
      .promise();

    return buildSuccessResult(null, 204);
  } catch (e: any) {
    console.log(e);
    return buildErrorResult({ message: e.message || "Something went wrong!" }, 500);
  }
};
