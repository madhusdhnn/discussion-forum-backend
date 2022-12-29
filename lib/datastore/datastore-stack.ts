import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DataStoreStack extends Stack {
  readonly channelsTable: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.channelsTable = new Table(this, "channels-table", {
      partitionKey: { name: "channelId", type: AttributeType.STRING },
      tableName: "Channels",
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
