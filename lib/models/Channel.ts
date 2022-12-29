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

export interface IChannelResponse {
  channelId: string;
  name: string;
  createdAt: Date;
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
  createdAt: number;
}

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
