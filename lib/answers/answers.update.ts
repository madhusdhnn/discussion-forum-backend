import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IAnswerUpdateRequest } from "../models/Answer";
import { IChannel } from "../models/Channel";
import { DEFAULT_ERROR_MESSAGE, isAppError, NotFoundError } from "../models/Errors";
import { buildErrorResult, buildSuccessResult, ensureChannelAccessForUser } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  const requestBody = JSON.parse(event.body) as IAnswerUpdateRequest;

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
      throw new NotFoundError(`No channel found: (Channel ID: ${requestBody.channelId})`);
    }

    ensureChannelAccessForUser(channel, requestBody.updatedBy);

    await ddb
      .update({
        TableName: process.env.ANSWERS_TABLE_NAME as string,
        Key: { questionId: requestBody.questionId, answerId: answerId },
        UpdateExpression: "SET answer = :answer, updatedAt = :updatedAt",
        ConditionExpression: "postedBy = :updatedBy",
        ExpressionAttributeValues: {
          ":answer": requestBody.answer,
          ":updatedBy": requestBody.updatedBy,
          ":updatedAt": new Date().getTime(),
        },
      })
      .promise();
    return buildSuccessResult(null, 204);
  } catch (e: any) {
    console.error(e);
    if (e.code && e.code === "ConditionalCheckFailedException") {
      return buildErrorResult(
        { message: `Access Denied: (User: ${requestBody.updatedBy} is not the owner of the answer)` },
        403
      );
    }
    if (isAppError(e)) {
      const { message, name } = e;
      return buildErrorResult({ message, name }, e.statusCode);
    }
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE }, 500);
  }
};
