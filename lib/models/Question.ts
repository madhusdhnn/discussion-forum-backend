import { IPagedResponse } from "./Pagination";

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
}

export interface IQuestion extends IQuestionBase {
  totalVotes: number;
  totalAnswers: number;
  createdAt: number;
  updatedAt: number;
}

export interface IQuestionVoteRequest {
  channelId: string;
  voter: string;
  operation: string;
}

export interface IQuestionCreateResponse {
  questionId: string;
  question: string;
  createdAt: Date;
}

export interface IQuestionResponse extends IQuestionBase {
  totalVotes: number;
  totalAnswers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionsPagedResponse extends IPagedResponse<IQuestionResponse> {}

export interface IDeleteQuestionRequest {
  requestedBy: string;
  channelId: string;
}
