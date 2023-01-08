import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DEFAULT_ERROR_MESSAGE, isAppError, PropertyRequiredError, ValidationError } from "../models/Errors";
import { IPagination } from "../models/Pagination";
import { IQuestionResponse, IQuestionsPagedResponse } from "../models/Question";
import { base64Decode, base64Encode, buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const channelId = event.queryStringParameters?.["channelId"];
    if (!channelId) {
      throw new PropertyRequiredError("Paramter missing: (Required parameter channelId is null or undefined)");
    }
    const count = parseInt(event.queryStringParameters?.["count"] as string) || 10;

    if (count < 1) {
      throw new ValidationError("Count must be greater than zero");
    }

    const dbParams: any = {
      TableName: process.env.QUESTIONS_TABLE_NAME as string,
      IndexName: process.env.QUESTIONS_CREATED_TIMESTAMP_INDEX as string,
      Limit: count,
      KeyConditionExpression: "channelId = :channelId",
      ExpressionAttributeValues: {
        ":channelId": channelId,
      },
    };

    const nextEvaluationKey = event.queryStringParameters?.["nextEvaluationKey"];

    const startDateTime = event.queryStringParameters?.["startDateTime"];
    const endDateTime = event.queryStringParameters?.["endDateTime"];

    if (nextEvaluationKey) {
      dbParams.ExclusiveStartKey = JSON.parse(base64Decode(nextEvaluationKey));
    }

    if (startDateTime) {
      if (!endDateTime) {
        throw new PropertyRequiredError(
          "Parameter missing: (endDateTime is a required parameter, when startDateTime is provided)"
        );
      }

      if (+new Date(endDateTime) <= +new Date(startDateTime)) {
        throw new ValidationError("EndDateTime must be after StartDateTime");
      }

      // As createdAt attribute is sortKey of LSI, KeyConditionExpression must be used instead of FilterExpression
      dbParams.KeyConditionExpression += " AND createdAt BETWEEN :startDateTime AND :endDateTime";
      dbParams.ExpressionAttributeValues = Object.assign({}, dbParams.ExpressionAttributeValues, {
        ":startDateTime": new Date(startDateTime).getTime(),
        ":endDateTime": new Date(endDateTime).getTime(),
      });
    }

    const result = await ddb.query(dbParams).promise();

    const items = (result.Items || []).map((item): IQuestionResponse => {
      const { channelId, questionId, question, owner, totalAnswers, totalVotes, createdAt, updatedAt } = item;
      return {
        channelId,
        questionId,
        question,
        owner,
        totalAnswers,
        totalVotes,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      };
    });

    let totalQuestions = 0;
    if (items.length > 0) {
      const channelGetResult = await ddb
        .get({
          TableName: process.env.CHANNELS_TABLE_NAME as string,
          Key: { channelId: channelId },
          ProjectionExpression: "totalQuestions",
        })
        .promise();

      const data = channelGetResult.Item as { totalQuestions: number };
      totalQuestions = data.totalQuestions;
    }

    const pagination: IPagination = {
      count: result.Count ?? 0,
      total: totalQuestions,
    };

    if (result.LastEvaluatedKey) {
      pagination.nextEvaluationKey = base64Encode(JSON.stringify(result.LastEvaluatedKey));
    }

    const response: IQuestionsPagedResponse = {
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
