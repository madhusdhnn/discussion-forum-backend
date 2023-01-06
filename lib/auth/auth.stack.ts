import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  AccountRecovery,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolOperation,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { dfAppClientOutputName, dfUserPoolIdOutputName } from "../cdk-commons";
import { DataStoreStack } from "../datastore/datastore.stack";
import path = require("path");

export class AuthStack extends Stack {
  readonly userPool: UserPool;

  constructor(scope: Construct, id: string, dataStoreStack: DataStoreStack, props: StackProps) {
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

    // TODO: Add cognito-idp:AdminAddUserToGroup permission to below function
    const postConfirmTriggerFunction = new NodejsFunction(this, "cognito-post-confirm-trigger-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "auth.post-confirm.ts"),
      handler: "handler",
      environment: {
        USERS_TABLE_NAME: dataStoreStack.usersTable.tableName,
      },
    });

    dataStoreStack.usersTable.grantWriteData(postConfirmTriggerFunction);

    this.userPool.addTrigger(UserPoolOperation.POST_CONFIRMATION, postConfirmTriggerFunction);

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
      exportName: dfUserPoolIdOutputName,
    });
    new CfnOutput(this, "df-app-client-id", {
      value: dfWebAppClient.userPoolClientId,
      exportName: dfAppClientOutputName,
    });
  }
}
