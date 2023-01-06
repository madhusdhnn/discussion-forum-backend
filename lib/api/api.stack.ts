import { Stack, StackProps } from "aws-cdk-lib";
import { Authorizer, CognitoUserPoolsAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { AuthStack } from "../auth/auth.stack";

export class ApiStack extends Stack {
  readonly restApi: RestApi;
  readonly dfUserPoolAuthorizer: Authorizer;

  constructor(scope: Construct, id: string, authStack: AuthStack, props?: StackProps) {
    super(scope, id, props);

    this.restApi = new RestApi(this, "discussion-forum-rest-api", {
      restApiName: "Discussion Forum REST API",
      description: "This is the API service for managing Discussion Forum backend like Channels, Posts, Replies, etc.",
      deployOptions: {
        stageName: "dev",
      },
    });

    this.dfUserPoolAuthorizer = new CognitoUserPoolsAuthorizer(this, "df-cognito-user-pool-authorizer", {
      cognitoUserPools: [authStack.userPool],
    });
  }
}
