import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { SQS } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { buildSuccessResult } from "../utils";

const ddb = new DocumentClient();
const sqs = new SQS();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const channelId = event.queryStringParameters?.["channelId"];

  await sqs
    .sendMessage({
      QueueUrl: process.env.DELETE_ALL_QUESTIONS_QUEUE_URL as string,
      MessageBody: JSON.stringify(channelId),
    })
    .promise();

  return buildSuccessResult(null, 204);
};
