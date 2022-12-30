export interface IAnswerRequest {
  answer: string;
  channelId: string;
  questionId: string;
  postedBy: string;
}

export interface IAnswer {
  answerId: string;
  answer: string;
  questionId: string;
  postedBy: string;
  voteCount: number;
  createdAt: number;
}

export interface IAnswerResponse {
  answerId: string;
  createdAt: Date;
}

export interface IAnswerVoteRequest {
  channelId: string;
  questionId: string;
  answerId: string;
  voter: string;
  operation: string;
}
