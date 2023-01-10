import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DEFAULT_ERROR_MESSAGE, NotFoundError } from "../models/Errors";
import { IDeleteQuestionRequest } from "../models/Question";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  const { channelId, requestedBy } = JSON.parse(event.body) as IDeleteQuestionRequest;
  try {
    const questionId = event.pathParameters?.["questionId"];
    const getChannelResult = await ddb
      .get({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId },
      })
      .promise();

    if (!getChannelResult.Item) {
      throw new NotFoundError(`No channel found: (Channel ID: ${channelId})`);
    }

    await ddb
      .delete({
        TableName: process.env.QUESTIONS_TABLE_NAME as string,
        Key: { channelId, questionId },
        ConditionExpression: "owner = :requestedBy",
        ExpressionAttributeValues: {
          ":requestedBy": requestedBy,
        },
      })
      .promise();
    return buildSuccessResult(null, 204);
  } catch (e: any) {
    console.error(e);
    if (e.code && e.code === "ConditionalCheckFailedException") {
      return buildErrorResult(
        { message: `Access Denied: (User: ${requestedBy} is not the owner of the question)` },
        403
      );
    }
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
