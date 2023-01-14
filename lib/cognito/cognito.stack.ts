import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  AccountRecovery,
  CfnUserPoolGroup,
  OAuthScope,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolOperation,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Effect, ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { DataStoreStack } from "../datastore/datastore.stack";
import { Roles } from "../models/Users";
import path = require("path");

export class CognitoStack extends Stack {
  readonly userPool: UserPool;
  readonly webAppClient: UserPoolClient;

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
        userId: new StringAttribute({ mutable: true }),
        firstName: new StringAttribute({ minLen: 1, mutable: true }),
        lastName: new StringAttribute({ minLen: 1, mutable: true }),
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const postConfirmTriggerFunction = this.createPostConfirmTriggerLambda(dataStoreStack);

    this.userPool.addTrigger(UserPoolOperation.POST_CONFIRMATION, postConfirmTriggerFunction);

    Object.values(Roles).forEach(
      (role) =>
        new CfnUserPoolGroup(this, `df-user-pool-group-${role.toLowerCase()}`, {
          userPoolId: this.userPool.userPoolId,
          groupName: role,
        })
    );

    this.webAppClient = this.userPool.addClient("discussion-forum-app-client", {
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
  }

  private createPostConfirmTriggerLambda(dataStoreStack: DataStoreStack): NodejsFunction {
    const postConfirmTriggerRole = new Role(this, "post-confirm-trigger-lambda-role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      description: "Post confirm lambda trigger execution role",
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    const cognitoAccessPolicy = new Policy(this, "cognito-access-policy", {
      policyName: "CognitoAccessPostConfirmTriggerPolicy",
      statements: [
        new PolicyStatement({
          sid: "CognitoAccessStatement",
          effect: Effect.ALLOW,
          actions: ["cognito-idp:AdminAddUserToGroup", "cognito-idp:AdminUpdateUserAttributes"],
          resources: [this.userPool.userPoolArn],
        }),
      ],
    });

    cognitoAccessPolicy.attachToRole(postConfirmTriggerRole);

    const postConfirmTriggerFunction = new NodejsFunction(this, "df-post-confirm-trigger-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "post-confirm.trigger.ts"),
      role: postConfirmTriggerRole,
      handler: "handler",
      environment: {
        USERS_TABLE_NAME: dataStoreStack.usersTable.tableName,
      },
    });
    dataStoreStack.usersTable.grantWriteData(postConfirmTriggerFunction);

    return postConfirmTriggerFunction;
  }
}
