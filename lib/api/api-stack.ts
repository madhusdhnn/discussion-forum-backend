import { Stack, StackProps } from "aws-cdk-lib";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class ApiStack extends Stack {
  readonly restApi: RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.restApi = new RestApi(this, "discussion-forum-rest-api", {
      restApiName: "Discussion Forum REST API",
      description: "This is the API service for managing Discussion Forum backend like Channels, Posts, Replies, etc.",
    });

    const adminApiKey = this.restApi.addApiKey("discussion-forum-admin-api-key", {
      description: "API key used to interact with Discussion Forum API resources that are limited to Admin users",
    });

    const usagePlan = this.restApi.addUsagePlan("discussion-forum-usage-plan", {
      name: "Discussion Forum API Usage Plan",
      apiStages: [
        {
          api: this.restApi,
          stage: this.restApi.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(adminApiKey);
  }
}
