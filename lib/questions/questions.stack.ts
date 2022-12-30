import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ApiStack } from "../api/api-stack";
import { DataStoreStack } from "../datastore/datastore-stack";
import path = require("path");

const apiPath = "questions";

export class QuestionsStack extends Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, dataStoreStack: DataStoreStack, props?: StackProps) {
    super(scope, id, props);

    const postFunction = new NodejsFunction(this, "create-question-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "questions.create.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
        QUESTIONS_TABLE_NAME: dataStoreStack.questionsTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantReadWriteData(postFunction);
    dataStoreStack.questionsTable.grantWriteData(postFunction);

    const voteQuestionFunction = new NodejsFunction(this, "vote-question-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "questions.vote.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
        QUESTIONS_TABLE_NAME: dataStoreStack.questionsTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantReadData(voteQuestionFunction);
    dataStoreStack.questionsTable.grantWriteData(voteQuestionFunction);

    const apiResource = apiStack.restApi.root.addResource(apiPath);

    apiResource.addMethod("POST", new LambdaIntegration(postFunction, { proxy: true }));
    apiResource.addResource("vote").addMethod("PUT", new LambdaIntegration(voteQuestionFunction, { proxy: true }));
  }
}