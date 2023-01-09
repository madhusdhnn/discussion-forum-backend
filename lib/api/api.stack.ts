import { Duration, Fn, Stack, StackProps } from "aws-cdk-lib";
import { Authorizer, RestApi, TokenAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CdkCommons } from "../cdk-commons";
import path = require("path");

export class ApiStack extends Stack {
  readonly restApi: RestApi;
  readonly dfTokenAuthorizer: Authorizer;

  constructor(scope: Construct, id: string, commons: CdkCommons, props?: StackProps) {
    super(scope, id, props);

    const restApiStage = "dev";
    this.restApi = new RestApi(this, "discussion-forum-rest-api", {
      restApiName: "Discussion Forum REST API",
      description: "This is the API service for managing Discussion Forum backend like Channels, Posts, Replies, etc.",
      deployOptions: {
        stageName: restApiStage,
      },
    });

    const tokenAuthorizerFunction = new NodejsFunction(this, "df-token-authorizer-function", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "authorizers", "api.token-authorizer.ts"),
      handler: "handler",
      environment: {
        USER_POOL_ID: Fn.importValue(commons.dfUserPoolIdOutputName),
        DF_WEB_APP_CLIENT_ID: Fn.importValue(commons.dfAppClientOutputName),
        ACCOUNT_ID: Fn.ref("AWS::AccountId"),
        REST_API_ID: this.restApi.restApiId,
        REST_API_STAGE_NAME: restApiStage,
      },
    });

    this.dfTokenAuthorizer = new TokenAuthorizer(this, "df-token-authorizer", {
      handler: tokenAuthorizerFunction,
      authorizerName: "DisucssionForumTokenAuthorizer",
      resultsCacheTtl: Duration.millis(0),
    });
  }
}
