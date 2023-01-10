import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { DEFAULT_ERROR_MESSAGE } from "../models/Errors";
import { ISignInRequest } from "../models/Users";
import { buildErrorResult, buildSuccessResult } from "../utils";

const cognito = new CognitoIdentityServiceProvider();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  const signInRequest = JSON.parse(event.body) as ISignInRequest;
  try {
    const result = await cognito
      .initiateAuth({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.CLIENT_ID as string,
        AuthParameters: {
          USERNAME: signInRequest.username,
          PASSWORD: signInRequest.password,
        },
      })
      .promise();
    return buildSuccessResult(result.AuthenticationResult, 200);
  } catch (e: any) {
    console.error(e);
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE });
  }
};
