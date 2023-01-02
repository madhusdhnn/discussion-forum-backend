import { IPagedResponse } from "./Pagination";

export const ChannelVisibility = {
  Public: "PUBLIC",
  Private: "PRIVATE",
} as const;

export interface IChannelRequest {
  owner: string;
  name: string;
  visibility: string;
}

export type ChannelVisibilityType = typeof ChannelVisibility[keyof typeof ChannelVisibility];

export interface IChannelSummaryResponse {
  channelId: string;
  name: string;
}

export interface IParticipant {
  isOwner: boolean;
  name: string;
}

export interface IChannel {
  owner: string;
  channelId: string;
  name: string;
  visibility: ChannelVisibilityType;
  participants: IParticipant[];
  totalQuestions: number;
  createdAt: number;
  updatedAt: number;
}

export interface IChannelResponse {
  owner: string;
  channelId: string;
  name: string;
  visibility: ChannelVisibilityType;
  participants: IParticipant[];
  totalQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannelsPagedResponse extends IPagedResponse<IChannelResponse> {}

export const parseChannelVisibility = (channelVisibilityStr: string): ChannelVisibilityType => {
  if (!channelVisibilityStr) {
    throw new Error("Channel visibility is null or undefined");
  }

  const result = Object.values(ChannelVisibility).find((ct) => ct.toLowerCase() === channelVisibilityStr.toLowerCase());
  if (!result) {
    throw new Error(`Unsupported channel visibility: ${channelVisibilityStr}`);
  }

  return result;
};
