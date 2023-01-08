import { Context, PostConfirmationConfirmSignUpTriggerEvent } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IUser, Roles } from "../models/Users";
import { generateSecureRandomId } from "../utils";

const cognito = new CognitoIdentityServiceProvider();
const ddb = new DocumentClient();

exports.handler = async (
  event: PostConfirmationConfirmSignUpTriggerEvent,
  context: Context
): Promise<PostConfirmationConfirmSignUpTriggerEvent> => {
  console.log(JSON.stringify(event), "Event");

  const { userAttributes } = event.request;
  const nowTime = new Date().getTime();

  const dbData: IUser = {
    userId: generateSecureRandomId(4),
    cognitoSub: userAttributes.sub,
    email: userAttributes.email,
    role: Roles.User,
    firstName: userAttributes["custom:firstName"],
    lastName: userAttributes["custom:lastName"],
    createdAt: nowTime,
    updatedAt: nowTime,
  };

  await ddb
    .put({
      TableName: process.env.USERS_TABLE_NAME as string,
      Item: dbData,
    })
    .promise();

  await cognito
    .adminAddUserToGroup({
      GroupName: Roles.User,
      Username: event.userName,
      UserPoolId: event.userPoolId,
    })
    .promise();

  await cognito
    .adminUpdateUserAttributes({
      Username: event.userName,
      UserPoolId: event.userPoolId,
      UserAttributes: [
        {
          Name: "custom:userId",
          Value: dbData.userId,
        },
      ],
    })
    .promise();
  return event;
};
