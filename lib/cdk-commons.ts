import { Construct } from "constructs";

export class CdkCommons extends Construct {
  readonly dfUserPoolIdOutputName = "DiscussionForum:UserPoolId";
  readonly dfAppClientOutputName = "DiscussionForum:AppClientId";
  readonly questionCreatedTimeStampIdxOutputName = "DiscussionForumDataStoreStack:QctIndex";
  readonly answersVoteIdxOutputName = "DiscussionForumDateStoreStack:avIndex";

  constructor(scope: Construct, id: string) {
    super(scope, id);
  }
}
