import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DeleteRequest, DocumentClient, WriteRequest } from "aws-sdk/clients/dynamodb";
import { IChannel } from "../models/Channel";
import { IQuestionBase, IQuestionVoteRequest, parseVoteOp, VoteOp, VoteOpType } from "../models/Question";
import { buildErrorResult, buildSuccessResult, ensureAccessForUser } from "../utils";

const ddb = new DocumentClient();

const getVoteOperator = (voteOp: VoteOpType): string => {
  switch (voteOp) {
    case "UP":
      return "+";
    case "DOWN":
      return "-";
    default:
      throw new Error("Vote operation type is null or undefined");
  }
};

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  try {
    const requestBody = JSON.parse(event.body) as IQuestionVoteRequest;

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

    if (
      !channel.participants.find((participant) => participant.name.toLowerCase() === requestBody.voter.toLowerCase())
    ) {
      throw new Error(
        `Access denied: (User - ${requestBody.voter} does not have access to the channel - ${channel.name})`
      );
    }

    const voteOp = parseVoteOp(requestBody.operation);

    await ddb
      .update({
        TableName: process.env.QUESTIONS_TABLE_NAME as string,
        Key: { channelId: requestBody.channelId, questionId: requestBody.questionId },
        UpdateExpression: "SET voteCount = voteCount " + getVoteOperator(voteOp) + " :value",
        ExpressionAttributeValues: {
          ":value": 1,
        },
      })
      .promise();

    return buildSuccessResult(null, 204);
  } catch (e: any) {
    return buildErrorResult({ message: e.message || "Something went wrong!" }, 500);
  }
};
