import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { SignUpRequest } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { DEFAULT_ERROR_MESSAGE } from "../models/Errors";
import { IUserRequest } from "../models/Users";
import { buildErrorResult, buildSuccessResult } from "../utils";

const cognito = new CognitoIdentityServiceProvider();

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return buildErrorResult({ error: "No request body found" }, 400);
  }

  try {
    const userRequest = JSON.parse(event.body) as IUserRequest;
    const params: SignUpRequest = {
      ClientId: process.env.CLIENT_ID as string,
      Username: userRequest.email,
      Password: userRequest.password,
      UserAttributes: [
        {
          Name: "email",
          Value: userRequest.email,
        },
        {
          Name: "custom:firstName",
          Value: userRequest.firstName,
        },
        {
          Name: "custom:lastName",
          Value: userRequest.lastName,
        },
      ],
    };

    await cognito.signUp(params).promise();
    return buildSuccessResult(null, 201);
  } catch (e: any) {
    console.error(e);
    return buildErrorResult({ message: DEFAULT_ERROR_MESSAGE }, 500);
  }
};
