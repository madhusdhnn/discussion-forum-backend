import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DEFAULT_ERROR_MESSAGE, isAppError } from "../models/Errors";
import { IQuestion, IQuestionResponse } from "../models/Question";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const questionId = event.pathParameters?.["questionId"];
    const channelId = event.queryStringParameters?.["channelId"];

    const result = await ddb
      .get({
        TableName: process.env.QUESTIONS_TABLE_NAME as string,
        Key: { channelId: channelId, questionId: questionId },
      })
      .promise();

    if (!result.Item) {
      return buildErrorResult(null, 404);
    }

    const question = result.Item as IQuestion;

    const response: IQuestionResponse = {
      channelId: question.channelId,
      questionId: question.questionId,
      question: question.question,
      postedBy: question.postedBy,
      totalAnswers: question.totalAnswers,
      totalVotes: question.totalVotes,
      createdAt: new Date(question.createdAt as number),
      updatedAt: new Date(question.updatedAt as number),
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
