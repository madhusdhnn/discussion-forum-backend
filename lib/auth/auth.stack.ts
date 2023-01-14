import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ApiStack } from "../api/api.stack";
import { CognitoStack } from "../cognito/cognito.stack";
import path = require("path");

const apiPath = "auth";

export class AuthStack extends Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, cognitoStack: CognitoStack, props: StackProps) {
    super(scope, id, props);

    const userRegisterFunction = new NodejsFunction(this, "user-register-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "auth.register.ts"),
      handler: "handler",
      environment: {
        DF_WEB_APP_CLIENT_ID: cognitoStack.webAppClient.userPoolClientId,
      },
    });

    const userConfirmFunction = new NodejsFunction(this, "user-confirm-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "auth.confirm.ts"),
      handler: "handler",
      environment: {
        DF_WEB_APP_CLIENT_ID: cognitoStack.webAppClient.userPoolClientId,
      },
    });

    const userSignInFunction = new NodejsFunction(this, "user-signin-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "auth.signin.ts"),
      handler: "handler",
      environment: {
        DF_WEB_APP_CLIENT_ID: cognitoStack.webAppClient.userPoolClientId,
      },
    });

    const apiResource = apiStack.restApi.root.addResource(apiPath);
    apiResource.addResource("register").addMethod("POST", new LambdaIntegration(userRegisterFunction, { proxy: true }));
    apiResource.addResource("confirm").addMethod("POST", new LambdaIntegration(userConfirmFunction, { proxy: true }));
    apiResource.addResource("signin").addMethod("POST", new LambdaIntegration(userSignInFunction, { proxy: true }));
  }
}
