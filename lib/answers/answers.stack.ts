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
    dataStoreStack.questionsTable.grantWriteData(postFunction);
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

    const updateFunction = new NodejsFunction(this, "update-answer-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "answers.update.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
        ANSWERS_TABLE_NAME: dataStoreStack.answersTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantReadData(updateFunction);
    dataStoreStack.answersTable.grantWriteData(updateFunction);

    const acceptAnswerFunction = new NodejsFunction(this, "accept-answer-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "answers.accept.ts"),
      handler: "handler",
      environment: {
        CHANNELS_TABLE_NAME: dataStoreStack.channelsTable.tableName,
        QUESTIONS_TABLE_NAME: dataStoreStack.questionsTable.tableName,
        ANSWERS_TABLE_NAME: dataStoreStack.answersTable.tableName,
      },
    });

    dataStoreStack.channelsTable.grantReadData(acceptAnswerFunction);
    dataStoreStack.questionsTable.grantReadData(acceptAnswerFunction);
    dataStoreStack.answersTable.grantWriteData(acceptAnswerFunction);

    const apiResource = apiStack.restApi.root.addResource(apiPath);
    apiResource.addMethod("POST", new LambdaIntegration(postFunction, { proxy: true }));

    const answerResource = apiResource.addResource("{answerId}");
    answerResource.addMethod("PUT", new LambdaIntegration(updateFunction, { proxy: true }));
    answerResource.addResource("vote").addMethod("PUT", new LambdaIntegration(voteAnswerFunction, { proxy: true }));
    answerResource.addResource("accept").addMethod("PUT", new LambdaIntegration(acceptAnswerFunction, { proxy: true }));
  }
}
