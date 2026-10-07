// builds the URL of a channel or direct message, optionally opening a thread
export const getChatHref = (workspaceId: string, location: { channelId?: string; otherMemberId?: string; threadId?: string }) => {
  const path = location.channelId ? `channel/${location.channelId}` : location.otherMemberId ? `member/${location.otherMemberId}` : null;

  if (!path) return null;

  return `/workspace/${workspaceId}/${path}${location.threadId ? `?parentMessageId=${location.threadId}` : ''}`;
};
