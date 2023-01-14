import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient, ScanInput } from "aws-sdk/clients/dynamodb";
import { IChannelResponse, IChannelsPagedResponse } from "../models/Channel";
import { DEFAULT_ERROR_MESSAGE, isAppError } from "../models/Errors";
import { IPagination } from "../models/Pagination";
import { base64Decode, base64Encode, buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const count = parseInt(event.queryStringParameters?.["count"] as string) || 10;
    const nextEvaluationKey = event.queryStringParameters?.["nextEvaluationKey"];

    const dbParams: ScanInput = {
      TableName: process.env.CHANNELS_TABLE_NAME as string,
      Limit: count,
      ProjectionExpression: "channelId,#CHNL_NAME,createdBy,visibility,totalQuestions,createdAt,updatedAt",
      ExpressionAttributeNames: {
        "#CHNL_NAME": "name",
      },
    };

    if (nextEvaluationKey) {
      dbParams.ExclusiveStartKey = JSON.parse(base64Decode(nextEvaluationKey));
    }

    const result = await ddb.scan(dbParams).promise();

    const items = (result.Items || []).map((item): IChannelResponse => {
      const { channelId, name, createdBy, totalQuestions, visibility, createdAt, updatedAt } = item;
      return {
        channelId,
        name,
        totalQuestions,
        createdBy,
        visibility,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      };
    });

    const pagination: IPagination = {
      count: result.Count ?? 0,
      total: result.Count ?? 0,
    };

    if (result.LastEvaluatedKey) {
      pagination.nextEvaluationKey = base64Encode(JSON.stringify(result.LastEvaluatedKey));
    }

    const response: IChannelsPagedResponse = {
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
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
