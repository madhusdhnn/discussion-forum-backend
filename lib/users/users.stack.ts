import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ApiStack } from "../api/api.stack";
import { DataStoreStack } from "../datastore/datastore.stack";
import path = require("path");

const apiPath = "users";

export class UsersStack extends Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, dataStoreStack: DataStoreStack, props: StackProps) {
    super(scope, id, props);

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

    apiResource.addResource("{userId}").addMethod("GET", new LambdaIntegration(getUserFunction, { proxy: true }), {
      authorizer: apiStack.dfTokenAuthorizer,
    });
  }
}
