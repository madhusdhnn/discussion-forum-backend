export interface IQuestionRequest {
  question: string;
  owner: string;
  channelId: string;
}

export interface IQuestionBase {
  question: string;
  owner: string;
  questionId: string;
  channelId: string;
  createdAt: number;
}

export interface IQuestion extends IQuestionBase {
  voteCount: number;
  answers: number;
}

export interface IQuestionVoteRequest {
  channelId: string;
  questionId: string;
  voter: string;
  operation: string;
}

export interface IQuestionResponse {
  questionId: string;
  question: string;
  createdAt: Date;
}
