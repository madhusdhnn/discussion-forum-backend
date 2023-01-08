import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  AccountRecovery,
  CfnUserPoolGroup,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolOperation,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CdkCommons } from "../cdk-commons";
import { DataStoreStack } from "../datastore/datastore.stack";
import { Roles } from "../models/Users";
import path = require("path");

export class AuthStack extends Stack {
  readonly userPool: UserPool;

  constructor(scope: Construct, id: string, dataStoreStack: DataStoreStack, commons: CdkCommons, props: StackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, "discussion-forum-user-pool", {
      userPoolName: "DiscussionForumUserPool",
      signInAliases: {
        email: true,
        username: false,
      },
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE,
        emailBody: "To verify your account, please use the code: {####}",
      },
      keepOriginal: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        userId: new StringAttribute({ mutable: false }),
        firstName: new StringAttribute({ minLen: 1, mutable: true }),
        lastName: new StringAttribute({ minLen: 1, mutable: true }),
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const postConfirmTriggerFunction = new NodejsFunction(this, "df-post-confirm-trigger-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "auth.post-confirm.ts"),
      handler: "handler",
      environment: {
        USERS_TABLE_NAME: dataStoreStack.usersTable.tableName,
      },
    });

    dataStoreStack.usersTable.grantWriteData(postConfirmTriggerFunction);

    this.userPool.addTrigger(UserPoolOperation.POST_CONFIRMATION, postConfirmTriggerFunction);

    postConfirmTriggerFunction.role?.attachInlinePolicy(
      new Policy(this, "cognito-access-policy", {
        statements: [
          new PolicyStatement({
            sid: "CognitoAccessPolicy",
            effect: Effect.ALLOW,
            actions: ["cognito-idp:AdminAddUserToGroup", "cognito-idp:AdminUpdateUserAttributes"],
            resources: [this.userPool.userPoolArn],
          }),
        ],
      })
    );

    Object.values(Roles).forEach(
      (role) =>
        new CfnUserPoolGroup(this, `df-user-pool-group-${role.toLowerCase()}`, {
          userPoolId: this.userPool.userPoolId,
          groupName: role,
        })
    );

    const dfWebAppClient = this.userPool.addClient("discussion-forum-app-client", {
      userPoolClientName: "DiscussionForum-Web-AppClient",
      authFlows: {
        userPassword: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true, implicitCodeGrant: true },
        scopes: [OAuthScope.COGNITO_ADMIN, OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
      },
      preventUserExistenceErrors: true,
    });

    new CfnOutput(this, "df-user-pool-id", {
      value: this.userPool.userPoolId,
      exportName: commons.dfUserPoolIdOutputName,
    });
    new CfnOutput(this, "df-app-client-id", {
      value: dfWebAppClient.userPoolClientId,
      exportName: commons.dfAppClientOutputName,
    });
  }
}
