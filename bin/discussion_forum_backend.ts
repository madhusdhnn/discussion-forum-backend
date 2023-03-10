#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { AnswersStack } from "../lib/answers/answers.stack";
import { ApiStack } from "../lib/api/api.stack";
import { AuthStack } from "../lib/auth/auth.stack";
import { CdkCommons } from "../lib/cdk-commons";
import { ChannelsStack } from "../lib/channels/channels.stack";
import { CognitoStack } from "../lib/cognito/cognito.stack";
import { DataStoreStack } from "../lib/datastore/datastore.stack";
import { QuestionsStack } from "../lib/questions/questions.stack";
import { UsersStack } from "../lib/users/users.stack";

const app = new cdk.App();
const stackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT as string,
    region: process.env.CDK_DEFAULT_REGION as string,
  },
};

const commons = new CdkCommons(app, "CommonsConstruct");

const dataStoreStack = new DataStoreStack(app, "DiscussionForumDataStoreStack", commons, {
  ...stackProps,
  description: "This stack creates DynamoDB tables and index for Discussion Forum backend",
});

const cognitoStack = new CognitoStack(app, "CognitoStack", dataStoreStack, {
  ...stackProps,
  description: "This stack creates Cognito user pool and an app client",
});

const apiStack = new ApiStack(app, "DiscussionForumApiStack", cognitoStack, {
  ...stackProps,
  description: "This stack creates an API Gateway REST API (with default configurations) for Discussion Forum backend",
});

new AuthStack(app, "AuthStack", apiStack, cognitoStack, {
  ...stackProps,
  description: "This stack creates the Lambda functions for sign up and sign in functionalities",
});

new ChannelsStack(app, "ChannelsStack", apiStack, dataStoreStack, {
  ...stackProps,
  description: "This stack creates the Lambda functions for Channel APIs",
});

new QuestionsStack(app, "QuestionsStack", apiStack, dataStoreStack, commons, {
  ...stackProps,
  description: "This stack creates the Lambda functions for Question APIs",
});

new AnswersStack(app, "AnswersStack", apiStack, dataStoreStack, commons, {
  ...stackProps,
  description: "This stack creates the Lambda functions for Answer APIs",
});

new UsersStack(app, "UsersStack", apiStack, dataStoreStack, cognitoStack, {
  ...stackProps,
  description: "This stack creates the Lambda functions for Users APIs",
});
