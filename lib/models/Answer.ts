export interface IAnswerRequest {
  answer: string;
  channelId: string;
  questionId: string;
  postedBy: string;
}

export interface IAnswerBase {
  answerId: string;
  answer: string;
  questionId: string;
}

export interface IAnswer extends IAnswerBase {
  isAccepted: boolean;
  postedBy: string;
  voteCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface IAnswerResponse {
  answerId: string;
  createdAt: Date;
}

export interface IAnswerVoteRequest {
  channelId: string;
  questionId: string;
  voter: string;
  operation: string;
}

export interface IAnswerUpdateRequest {
  channelId: string;
  questionId: string;
  answer: string;
  updatedBy: string;
}

export interface IAnswerAcceptRequest {
  channelId: string;
  questionId: string;
  isAccepted: boolean;
  acceptor: string;
}
