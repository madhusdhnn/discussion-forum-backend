import { Fn, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ApiStack } from "../api/api.stack";
import { CdkCommons } from "../cdk-commons";
import { DataStoreStack } from "../datastore/datastore.stack";
import path = require("path");

const apiPath = "users";

export class UsersStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    apiStack: ApiStack,
    dataStoreStack: DataStoreStack,
    commons: CdkCommons,
    props: StackProps
  ) {
    super(scope, id, props);

    const userRegisterFunction = new NodejsFunction(this, "user-register-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "users.register.ts"),
      handler: "handler",
      environment: {
        CLIENT_ID: Fn.importValue(commons.dfAppClientOutputName),
      },
    });

    const userConfirmFunction = new NodejsFunction(this, "user-confirm-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "users.confirm.ts"),
      handler: "handler",
      environment: {
        CLIENT_ID: Fn.importValue(commons.dfAppClientOutputName),
      },
    });

    const userSignInFunction = new NodejsFunction(this, "user-signin-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "users.signin.ts"),
      handler: "handler",
      environment: {
        CLIENT_ID: Fn.importValue(commons.dfAppClientOutputName),
      },
    });

    const getUserFunction = new NodejsFunction(this, "get-user-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "users.get.ts"),
      handler: "handler",
      environment: {
        USERS_TABLE_NAME: dataStoreStack.usersTable.tableName,
      },
    });

    dataStoreStack.usersTable.grantReadData(getUserFunction);

    const apiResource = apiStack.restApi.root.addResource(apiPath);
    apiResource.addResource("register").addMethod("POST", new LambdaIntegration(userRegisterFunction, { proxy: true }));
    apiResource.addResource("confirm").addMethod("POST", new LambdaIntegration(userConfirmFunction, { proxy: true }));
    apiResource.addResource("signin").addMethod("POST", new LambdaIntegration(userSignInFunction, { proxy: true }));

    const userResource = apiResource.addResource("{userId}");
    userResource.addMethod("GET", new LambdaIntegration(getUserFunction, { proxy: true }), {
      authorizer: apiStack.dfTokenAuthorizer,
    });
  }
}
