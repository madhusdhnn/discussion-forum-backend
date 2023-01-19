import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Effect, ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ApiStack } from "../api/api.stack";
import { CognitoStack } from "../cognito/cognito.stack";
import { DataStoreStack } from "../datastore/datastore.stack";
import path = require("path");

const apiPath = "users";

export class UsersStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    apiStack: ApiStack,
    dataStoreStack: DataStoreStack,
    cognitoStack: CognitoStack,
    props: StackProps
  ) {
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

    const userRoleAdminUpdateLambdaRole = new Role(this, "user-role-admin-update-lambda-role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      description: "User role admin update lambda role",
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    const cognitoAccessPolicy = new Policy(this, "urau-cognito-access-policy", {
      policyName: "CognitoAccessUserRoleAdmiUpdatePolicy",
      statements: [
        new PolicyStatement({
          sid: "CognitoAccessUserRoleAdmiUpdateStatement",
          effect: Effect.ALLOW,
          actions: ["cognito-idp:AdminRemoveUserFromGroup", "cognito-idp:AdminAddUserToGroup"],
          resources: [cognitoStack.userPool.userPoolArn],
        }),
      ],
    });

    cognitoAccessPolicy.attachToRole(userRoleAdminUpdateLambdaRole);

    const updateRoleFunction = new NodejsFunction(this, "user-role-admin-update-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "user-role.admin-update.ts"),
      handler: "handler",
      role: userRoleAdminUpdateLambdaRole,
      environment: {
        USERS_TABLE_NAME: dataStoreStack.usersTable.tableName,
        DF_USER_POOL_ID: cognitoStack.userPool.userPoolId,
      },
    });

    dataStoreStack.usersTable.grantWriteData(updateRoleFunction);

    const apiResource = apiStack.restApi.root.addResource(apiPath);

    apiResource.addResource("{userId}").addMethod("GET", new LambdaIntegration(getUserFunction, { proxy: true }), {
      authorizer: apiStack.dfTokenAuthorizer,
    });

    const rolesResource = apiResource.addResource("roles");
    rolesResource.addMethod("PUT", new LambdaIntegration(updateRoleFunction, { proxy: true }), {
      authorizer: apiStack.dfTokenAuthorizer,
    });
  }
}
