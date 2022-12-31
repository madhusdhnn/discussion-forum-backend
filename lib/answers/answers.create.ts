import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IAnswer, IAnswerRequest, IAnswerResponse } from "../models/Answer";
import { IChannel } from "../models/Channel";
import { buildErrorResult, buildSuccessResult, ensureChannelAccessForUser, generateSecureRandomId } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  try {
    const requestBody = JSON.parse(event.body) as IAnswerRequest;

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

    ensureChannelAccessForUser(channel, requestBody.postedBy);

    const nowTime = new Date().getTime();

    const dbData: IAnswer = {
      answerId: generateSecureRandomId(4),
      ...requestBody,
      voteCount: 0,
      isAccepted: false,
      createdAt: nowTime,
      updatedAt: nowTime,
    };

    await ddb
      .put({
        TableName: process.env.ANSWERS_TABLE_NAME as string,
        Item: dbData,
      })
      .promise();

    await ddb
      .update({
        TableName: process.env.QUESTIONS_TABLE_NAME as string,
        Key: { channelId: requestBody.channelId, questionId: requestBody.questionId },
        UpdateExpression: "SET answers = answers + :value",
        ExpressionAttributeValues: {
          ":value": 1,
        },
      })
      .promise();

    const response: IAnswerResponse = {
      answerId: dbData.answerId,
      createdAt: new Date(dbData.createdAt),
    };

    return buildSuccessResult(response, 201);
  } catch (e: any) {
    console.log(e);
    return buildErrorResult({ message: e.message || "Something went wrong!" }, 500);
  }
};
