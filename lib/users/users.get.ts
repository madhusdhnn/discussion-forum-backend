import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DEFAULT_ERROR_MESSAGE } from "../models/Errors";
import { IUser, IUserResponse } from "../models/Users";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    let userId = event.pathParameters?.["userId"];

    if (userId === "me") {
      userId = event.requestContext.authorizer?.userId as string;
    }

    const userResult = await ddb
      .get({
        TableName: process.env.USERS_TABLE_NAME as string,
        Key: { userId },
        ProjectionExpression: "userId,email,cognitoSub,firstName,lastName,createdAt,updatedAt",
      })
      .promise();

    if (!userResult.Item) {
      return buildErrorResult(null, 404);
    }

    const user = userResult.Item as IUser;
    const response: IUserResponse = {
      userId: user.userId,
      email: user.email,
      cognitoSub: user.cognitoSub,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };

    return buildSuccessResult(response);
  } catch (e: any) {
    console.error(e);
    return buildErrorResult(DEFAULT_ERROR_MESSAGE);
  }
};
