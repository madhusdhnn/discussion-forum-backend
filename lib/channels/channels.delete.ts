import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DEFAULT_ERROR_MESSAGE } from "../models/Errors";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const channelId = event.pathParameters?.["channelId"];

    await ddb
      .delete({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId },
      })
      .promise();
    return buildSuccessResult(null, 204);
  } catch (e: any) {
    console.error(e);
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
