#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../lib/api/api-stack";
import { DataStoreStack } from "../lib/datastore/datastore-stack";
import { ChannelsStack } from "../lib/channels/channels.stack";

const app = new cdk.App();
const stackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT as string,
    region: process.env.CDK_DEFAULT_REGION as string,
  },
};

const apiStack = new ApiStack(app, "DiscussionForumApiStack", stackProps);
const dataStoreStack = new DataStoreStack(app, "DiscussionForumDataStoreStack", stackProps);

new ChannelsStack(app, "ChannelsStack", apiStack, dataStoreStack, stackProps);
