import { Context, PostConfirmationConfirmSignUpTriggerEvent } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const cognito = new CognitoIdentityServiceProvider();
const ddb = new DocumentClient();

exports.handler = async (
  event: PostConfirmationConfirmSignUpTriggerEvent,
  context: Context
): Promise<PostConfirmationConfirmSignUpTriggerEvent> => {
  console.log(JSON.stringify(event), "Event");

  /* const nowTime = new Date().getTime();

  const dbData: IUser = {
    userId: email,
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
    .promise(); */
  /* 
  await cognito
    .adminAddUserToGroup({
      GroupName: Roles.User,
      Username: email,
      UserPoolId: event.userPoolId,
    })
    .promise(); */

  return event;
};
