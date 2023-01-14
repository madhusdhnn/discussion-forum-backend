import { IllegalArgumentError, ValidationError } from "./Errors";
import { IPagedResponse } from "./Pagination";

export const ChannelVisibility = {
  Public: "PUBLIC",
  Private: "PRIVATE",
} as const;

export interface IChannelRequest {
  createdBy: string;
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
  createdBy: string;
  channelId: string;
  name: string;
  visibility: ChannelVisibilityType;
  participants: IParticipant[];
  totalQuestions: number;
  createdAt: number;
  updatedAt: number;
}

export interface IChannelResponse {
  createdBy: string;
  channelId: string;
  name: string;
  visibility: ChannelVisibilityType;
  totalQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannelParticipants {
  participants: IParticipant[];
}

export interface IChannelsPagedResponse extends IPagedResponse<IChannelResponse> {}

export const parseChannelVisibility = (channelVisibilityStr: string): ChannelVisibilityType => {
  if (!channelVisibilityStr) {
    throw new IllegalArgumentError("Channel visibility is null or undefined");
  }

  const result = Object.values(ChannelVisibility).find((ct) => ct.toLowerCase() === channelVisibilityStr.toLowerCase());
  if (!result) {
    throw new ValidationError(`Unsupported channel visibility: ${channelVisibilityStr}`);
  }

  return result;
};
