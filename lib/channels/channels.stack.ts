import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ApiStack } from "../api/api-stack";
import { DataStoreStack } from "../datastore/datastore-stack";
import path = require("path");

const apiPath = "channels";

export class ChannelsStack extends Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, dataStoreStack: DataStoreStack, props?: StackProps) {
    super(scope, id, props);

    const postFunction = new NodejsFunction(this, "create-channel-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "channels.create.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantWriteData(postFunction);

    const addUserToChannelFunction = new NodejsFunction(this, "add-user-to-channel-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "channels.add-user.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantReadWriteData(addUserToChannelFunction);

    const apiResource = apiStack.restApi.root.addResource(apiPath);

    apiResource.addMethod("POST", new LambdaIntegration(postFunction, { proxy: true }));
    apiResource
      .addResource("{channelId}")
      .addMethod("PUT", new LambdaIntegration(addUserToChannelFunction, { proxy: true }));
  }
}