import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IAnswerAcceptRequest } from "../models/Answer";
import { IChannel } from "../models/Channel";
import { buildErrorResult, buildSuccessResult, ensureChannelAccessForUser } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  const requestBody = JSON.parse(event.body) as IAnswerAcceptRequest;

  try {
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

    ensureChannelAccessForUser(channel, requestBody.acceptor);

    const getQuestionsResult = await ddb
      .get({
        TableName: process.env.QUESTIONS_TABLE_NAME as string,
        Key: { channelId: requestBody.channelId, questionId: requestBody.questionId },
        ProjectionExpression: "#O",
        ExpressionAttributeNames: {
          "#O": "owner",
        },
      })
      .promise();

    const { owner } = getQuestionsResult.Item as any;

    if (requestBody.acceptor !== owner) {
      throw new Error(`Access denied: (User ${requestBody.acceptor} is not the owner of the question)`);
    }

    await ddb
      .update({
        TableName: process.env.ANSWERS_TABLE_NAME as string,
        Key: { questionId: requestBody.questionId, answerId: answerId },
        UpdateExpression: "SET isAccepted = :isAccepted, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":isAccepted": requestBody.isAccepted,
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
