import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ApiStack } from "../api/api-stack";
import { DataStoreStack } from "../datastore/datastore-stack";
import path = require("path");

const apiPath = "answers";

export class AnswersStack extends Stack {
  constructor(scope: Construct, id: string, apiStack: ApiStack, dataStoreStack: DataStoreStack, props?: StackProps) {
    super(scope, id, props);

    const postFunction = new NodejsFunction(this, "create-answer-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "answers.create.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
        QUESTIONS_TABLE_NAME: dataStoreStack.questionsTable.tableName,
        ANSWERS_TABLE_NAME: dataStoreStack.answersTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantReadData(postFunction);
    dataStoreStack.questionsTable.grantReadWriteData(postFunction);
    dataStoreStack.answersTable.grantWriteData(postFunction);

    const voteAnswerFunction = new NodejsFunction(this, "vote-answer-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "answers.vote.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
        ANSWERS_TABLE_NAME: dataStoreStack.answersTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantReadData(voteAnswerFunction);
    dataStoreStack.answersTable.grantWriteData(voteAnswerFunction);

    const apiResource = apiStack.restApi.root.addResource(apiPath);

    apiResource.addMethod("POST", new LambdaIntegration(postFunction, { proxy: true }));
    apiResource.addResource("vote").addMethod("PUT", new LambdaIntegration(voteAnswerFunction, { proxy: true }));
  }
}
