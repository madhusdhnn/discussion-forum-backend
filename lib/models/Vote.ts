export const VoteOp = {
  Up: "UP",
  Down: "DOWN",
} as const;

export type VoteOpType = typeof VoteOp[keyof typeof VoteOp] | null;

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
