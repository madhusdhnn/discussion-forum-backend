import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  AccountRecovery,
  StringAttribute,
  UserPool,
  UserPoolOperation,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path = require("path");

export class AuthStack extends Stack {
  readonly userPool;
  readonly dfAppClientOutputName = "DiscussionForum:AppClientId";
  readonly dfUserPoolIdOutputName: "DiscussionForum:UserPoolId";

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, "discussion-forum-user-pool", {
      userPoolName: "DiscussionForumUserPool",
      signInAliases: {
        email: true,
        username: false,
      },
      passwordPolicy: {
        tempPasswordValidity: Duration.days(2),
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
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

    const postConfirmTriggerFunction = new NodejsFunction(this, "cognito-post-confirm-trigger-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "../", "cognito-triggers", "triggers.post-confirm.ts"),
      handler: "handler",
    });

    this.userPool.addTrigger(UserPoolOperation.POST_CONFIRMATION, postConfirmTriggerFunction);

    const dfWebAppClient = this.userPool.addClient("discussion-forum-app-client", {
      userPoolClientName: "DiscussionForum-Web-AppClient",
      authFlows: {
        userPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    new CfnOutput(this, "df-user-pool-id", {
      value: this.userPool.userPoolId,
      exportName: this.dfUserPoolIdOutputName,
    });
    new CfnOutput(this, "df-app-client-id", {
      value: dfWebAppClient.userPoolClientId,
      exportName: this.dfAppClientOutputName,
    });
  }
}
