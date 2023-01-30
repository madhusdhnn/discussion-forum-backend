import { Effect } from "aws-cdk-lib/aws-iam";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { APIGatewayTokenAuthorizerEvent, AuthResponse, Statement } from "aws-lambda";

import { Roles, RoleStrings } from "../models/Users";

const userPoolId = process.env.DF_USER_POOL_ID as string;
const dfWebAppClientId = process.env.DF_WEB_APP_CLIENT_ID as string;

const idTokenVerifier = CognitoJwtVerifier.create({ userPoolId, clientId: dfWebAppClientId, tokenUse: "id" });

const defaultDenyAllStatement: Statement = {
  Sid: "DiscussionForumApiDefaultDeny",
  Action: "execute-api:Invoke",
  Effect: Effect.DENY,
  Resource: "*",
};

const generatePolicyStatement = (role: RoleStrings, methodArn: string): Statement => {
  const methodArnSections = methodArn.split(":");
  const resourcePathSpecifier = methodArnSections[5];

  let effect = Effect.ALLOW;

  if (
    resourcePathSpecifier.endsWith("POST/channels") ||
    resourcePathSpecifier.includes("PUT/channels") ||
    resourcePathSpecifier.includes("DELETE/channels") ||
    resourcePathSpecifier.endsWith("DELETE/questions")
  ) {
    effect = role === "SUPER_ADMIN" || role === "ADMIN" ? Effect.ALLOW : Effect.DENY;
  }

  if (resourcePathSpecifier.endsWith("PUT/users/roles")) {
    effect = role === "SUPER_ADMIN" ? Effect.ALLOW : Effect.DENY;
  }

  const arn = `arn:aws:execute-api:${process.env.AWS_REGION}:${process.env.ACCOUNT_ID}:${process.env.DF_REST_API_ID}`;

  return {
    Sid: "DiscussionForumApiAccess",
    Effect: effect,
    Action: "execute-api:Invoke",
    Resource: `${arn}/*/*`,
  };
};

exports.handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<AuthResponse> => {
  const authorizationToken = event.authorizationToken;
  if (!authorizationToken) {
    throw new Error("Unauthorized");
  }

  let payload;
  try {
    payload = await idTokenVerifier.verify(authorizationToken);
  } catch (e: any) {
    console.error(e);
    throw new Error("Unauthorized"); // API Gateway expects exact error message for 401 status code
  }

  const userId = payload["custom:userId"] as string;
  const username = payload["cognito:username"] as string;
  const groups = payload["cognito:groups"] || [];

  const statements = Object.values(Roles)
    .filter((_role) => groups.includes(_role))
    .map((role) => generatePolicyStatement(role, event.methodArn));

  if (statements.length === 0) {
    statements.push(defaultDenyAllStatement);
  }

  return {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: statements,
    },
    context: {
      userId,
      groups: JSON.stringify(groups),
    },
  };
};
