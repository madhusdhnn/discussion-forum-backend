import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IChannel } from "../models/Channel";
import { IQuestion, IQuestionRequest, IQuestionResponse } from "../models/Question";
import { buildErrorResult, buildSuccessResult, ensureChannelAccessForUser, generateSecureRandomId } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  const questionRequest = JSON.parse(event.body) as IQuestionRequest;
  const questionId = generateSecureRandomId(4);

  try {
    const getChannelResult = await ddb
      .get({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId: questionRequest.channelId },
      })
      .promise();

    const channel = getChannelResult.Item as IChannel;

    if (!channel) {
      throw new Error(`No channel found: (Channel ID: ${questionRequest.channelId})`);
    }

    ensureChannelAccessForUser(channel, questionRequest.owner);

    const nowTime = new Date().getTime();

    const dbData: IQuestion = {
      owner: questionRequest.owner,
      channelId: questionRequest.channelId,
      question: questionRequest.question,
      questionId: questionId,
      voteCount: 0,
      answers: 0,
      createdAt: nowTime,
      updatedAt: nowTime,
    };

    await ddb
      .put({
        TableName: process.env.QUESTIONS_TABLE_NAME as string,
        Item: dbData,
      })
      .promise();

    await ddb
      .update({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId: questionRequest.channelId },
        UpdateExpression: "SET questions = questions + :value",
        ExpressionAttributeValues: {
          ":value": 1,
        },
      })
      .promise();

    const response: IQuestionResponse = {
      questionId: dbData.questionId,
      question: dbData.question,
      createdAt: new Date(dbData.createdAt),
    };

    return buildSuccessResult(response, 201);
  } catch (e: any) {
    console.log(e);
    return buildErrorResult({ message: e.message || "Something went wrong!" }, 500);
  }
};
