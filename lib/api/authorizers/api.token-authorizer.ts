import { Effect } from "aws-cdk-lib/aws-iam";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { APIGatewayTokenAuthorizerEvent, AuthResponse, Statement } from "aws-lambda";

import { Roles, RoleStrings } from "../../models/Users";

const userPoolId = process.env.USER_POOL_ID as string;
const dfWebAppClientId = process.env.DF_WEB_APP_CLIENT_ID as string;

const cognitoJwtVerifier = CognitoJwtVerifier.create({ userPoolId });

const generatePolicyStatement = (role: RoleStrings, methodArn: string): Statement => {
  const methodArnSections = methodArn.split(":");
  const resourcePathSpecifier = methodArnSections[5];

  let effect = !role ? Effect.DENY : Effect.ALLOW;

  if (resourcePathSpecifier.endsWith("POST/channels") || resourcePathSpecifier.includes("PUT/channels")) {
    effect = role === "SUPER_ADMIN" || role === "ADMIN" ? Effect.ALLOW : Effect.DENY;
  }

  return {
    Sid: "DiscussionForumApiAccess",
    Effect: effect,
    Action: "execute-api:Invoke",
    Resource: `arn:aws:execute-api:${process.env.AWS_REGION}:*:*`,
  };
};

exports.handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<AuthResponse> => {
  const authorizationToken = event.authorizationToken;
  if (!authorizationToken) {
    throw new Error("Unauthorized");
  }

  let payload;
  try {
    payload = await cognitoJwtVerifier.verify(authorizationToken, {
      clientId: dfWebAppClientId,
      tokenUse: "id",
    });
  } catch (e: any) {
    console.error(e);
    throw new Error("Unauthorized"); // API Gateway expects exact error message for 401 status code
  }

  const email = payload["email"] as string;
  const userId = payload["custom:userId"] as string;
  const username = payload["cognito:username"] as string;
  const groups = payload["cognito:groups"] || [];

  const role: RoleStrings = Object.values(Roles).find((_role) => groups.includes(_role));

  const statement = generatePolicyStatement(role, event.methodArn);

  return {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [statement],
    },
    context: {
      userId,
      email,
      groups: JSON.stringify(groups),
    },
  };
};
