import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DEFAULT_ERROR_MESSAGE, isAppError } from "../models/Errors";
import { IUserRoleChangeRequest, parseRole } from "../models/Users";
import { buildErrorResult, buildSuccessResult } from "../utils";

const ddb = new DocumentClient();
const cognito = new CognitoIdentityServiceProvider();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  try {
    const request = JSON.parse(event.body) as IUserRoleChangeRequest;
    const newRole = parseRole(request.role);

    const result = await ddb
      .update({
        TableName: process.env.USERS_TABLE_NAME as string,
        ReturnValues: "UPDATED_OLD",
        Key: { userId: request.userId },
        UpdateExpression: "SET #R = :newRole",
        ExpressionAttributeNames: {
          "#R": "role",
        },
        ExpressionAttributeValues: {
          ":newRole": newRole,
        },
      })
      .promise();

    const oldRole = result.Attributes?.["role"] as string;

    await cognito
      .adminRemoveUserFromGroup({
        GroupName: oldRole,
        Username: request.username,
        UserPoolId: process.env.DF_USER_POOL_ID as string,
      })
      .promise();

    await cognito
      .adminAddUserToGroup({
        GroupName: newRole,
        Username: request.username,
        UserPoolId: process.env.DF_USER_POOL_ID as string,
      })
      .promise();
    return buildSuccessResult(null, 204);
  } catch (e: any) {
    console.error(e);
    if (isAppError(e)) {
      const { message, name } = e;
      return buildErrorResult({ message, name }, e.statusCode);
    }
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
