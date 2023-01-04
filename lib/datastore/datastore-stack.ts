import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, CfnTable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export type LocalSecondaryIndexListType = Array<CfnTable.LocalSecondaryIndexProperty> | undefined;

export class DataStoreStack extends Stack {
  readonly channelsTable: Table;
  readonly questionsTable: Table;
  readonly answersTable: Table;
  readonly usersTable: Table;

  readonly questionCreatedTimeStampIdxOutputName = "DiscussionForumDataStoreStack:QctIndex";
  readonly answersVoteIdxOutputName = "DiscussionForumDateStoreStack:avIndex";

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

    const questionsCreatedTimeStampIdxOutput = new CfnOutput(this, "questions-created-timestamp-index", {
      value: "QuestionsCreatedTimestampIndex",
      exportName: this.questionCreatedTimeStampIdxOutputName,
    });

    this.questionsTable.addLocalSecondaryIndex({
      indexName: questionsCreatedTimeStampIdxOutput.value,
      sortKey: { name: "createdAt", type: AttributeType.NUMBER },
    });

    this.answersTable = new Table(this, "answers-table", {
      partitionKey: { name: "questionId", type: AttributeType.STRING },
      sortKey: { name: "answerId", type: AttributeType.STRING },
      tableName: "Answers",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const answersVoteIdxOutput = new CfnOutput(this, "answers-vote-index", {
      value: "AnswersVoteIndex",
      exportName: this.answersVoteIdxOutputName,
    });

    this.answersTable.addLocalSecondaryIndex({
      indexName: answersVoteIdxOutput.value,
      sortKey: { name: "totalVotes", type: AttributeType.NUMBER },
    });

    this.usersTable = new Table(this, "users-table", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      tableName: "Users",
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
