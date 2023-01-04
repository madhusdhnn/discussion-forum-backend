import { Context, PostConfirmationConfirmSignUpTriggerEvent } from "aws-lambda";

exports.handler = async (
  event: PostConfirmationConfirmSignUpTriggerEvent,
  context: Context
): Promise<PostConfirmationConfirmSignUpTriggerEvent> => {
  console.log(JSON.stringify(event.request), "Request");
  console.log(event.userName, "Username");

  // TODO: Create new user in users table with cognito sub as user id (UUID). Add user to respective group also

  return event;
};
