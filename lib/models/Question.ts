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
}

export const VoteOp = {
  Up: "UP",
  Down: "DOWN",
} as const;

export type VoteOpType = typeof VoteOp[keyof typeof VoteOp] | null;

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

export const parseVoteOp = (voteOpStr: string): VoteOpType => {
  if (!voteOpStr) {
    return null;
  }

  const result = Object.values(VoteOp).find((v) => v.toLowerCase() === voteOpStr.toLowerCase());
  if (!result) {
    throw new Error(`Invalid vote operation: ${voteOpStr}`);
  }

  return result;
};
