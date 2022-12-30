import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DataStoreStack extends Stack {
  readonly channelsTable: Table;
  readonly questionsTable: Table;
  readonly answersTable: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.channelsTable = new Table(this, "channels-table", {
      partitionKey: { name: "channelId", type: AttributeType.STRING },
      tableName: "Channels",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.questionsTable = new Table(this, "questions-table", {
      partitionKey: { name: "channelId", type: AttributeType.STRING },
      sortKey: { name: "questionId", type: AttributeType.STRING },
      tableName: "Questions",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.answersTable = new Table(this, "answers-table", {
      partitionKey: { name: "questionId", type: AttributeType.STRING },
      sortKey: { name: "answerId", type: AttributeType.STRING },
      tableName: "Answers",
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
