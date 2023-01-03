import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IAnswerResponse, IAnswersPagedResponse } from "../models/Answer";
import { DEFAULT_ERROR_MESSAGE, isAppError, PropertyRequiredError } from "../models/Errors";
import { IPagination } from "../models/Pagination";
import { base64Decode, base64Encode, buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const channelId = event.queryStringParameters?.["channelId"];
    const questionId = event.queryStringParameters?.["questionId"];

    if (!channelId || !questionId) {
      throw new PropertyRequiredError(
        "Paramter missing: (Required parameters channelId and/ or questionId is null or undefined)"
      );
    }

    const count = parseInt(event.queryStringParameters?.["count"] as string) || 10;
    const nextEvaluationKey = event.queryStringParameters?.["nextEvaluationKey"];

    const dbParams: any = {
      TableName: process.env.ANSWERS_TABLE_NAME as string,
      IndexName: process.env.ANSWERS_VOTE_INDEX as string,
      KeyConditionExpression: "questionId = :questionId",
      ScanIndexForward: false, // sort descending - top voted first
      ExpressionAttributeValues: {
        ":questionId": questionId,
      },
      Limit: count,
    };

    if (nextEvaluationKey) {
      dbParams.ExclusiveStartKey = JSON.parse(base64Decode(nextEvaluationKey));
    }

    const result = await ddb.query(dbParams).promise();
    const items = (result.Items || []).map((item): IAnswerResponse => {
      const { answerId, answer, questionId, isAccepted, postedBy, totalVotes, createdAt, updatedAt } = item;
      return {
        answerId,
        questionId,
        answer,
        postedBy,
        isAccepted,
        totalVotes,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      };
    });

    let totalAnswers = 0;
    if (items.length > 0) {
      const questionGetResult = await ddb
        .get({
          TableName: process.env.QUESTIONS_TABLE_NAME as string,
          Key: { channelId, questionId },
          ProjectionExpression: "totalAnswers",
        })
        .promise();

      const data = questionGetResult.Item as { totalAnswers: number };
      totalAnswers = data.totalAnswers;
    }

    const pagination: IPagination = {
      count: result.Count ?? 0,
      total: totalAnswers,
    };

    if (result.LastEvaluatedKey) {
      pagination.nextEvaluationKey = base64Encode(JSON.stringify(result.LastEvaluatedKey));
    }

    const response: IAnswersPagedResponse = {
      data: items,
      pagination: pagination,
    };

    return buildSuccessResult(response);
  } catch (e: any) {
    console.error(e);
    if (isAppError(e)) {
      const { message, name } = e;
      return buildErrorResult({ message, name }, e.statusCode);
    }
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE }, 500);
  }
};
