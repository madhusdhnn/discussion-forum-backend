import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ConfirmSignUpRequest } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { DEFAULT_ERROR_MESSAGE } from "../models/Errors";
import { IConfirmUserRequest } from "../models/Users";
import { buildErrorResult, buildSuccessResult } from "../utils";

const cognito = new CognitoIdentityServiceProvider();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }
  try {
    const requestBody = JSON.parse(event.body) as IConfirmUserRequest;
    const params: ConfirmSignUpRequest = {
      ClientId: process.env.DF_WEB_APP_CLIENT_ID as string,
      ConfirmationCode: requestBody.confirmationCode,
      Username: requestBody.email,
    };
    await cognito.confirmSignUp(params).promise();
    return buildSuccessResult(null, 200);
  } catch (e: any) {
    console.error(e);
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
