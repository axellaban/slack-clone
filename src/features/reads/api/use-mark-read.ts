import { useMutation } from 'convex/react';
import { useEffect } from 'react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseMarkReadProps {
  workspaceId: Id<'workspaces'>;
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  // changes whenever a new message arrives, so it is marked read while the chat is open
  latestMessageId?: Id<'messages'>;
}

export const useMarkRead = ({ workspaceId, channelId, conversationId, latestMessageId }: UseMarkReadProps) => {
  const markRead = useMutation(api.reads.markRead);

  useEffect(() => {
    if (!channelId && !conversationId) return;

    const mark = () => {
      if (document.visibilityState !== 'visible') return;

      markRead({ workspaceId, channelId, conversationId }).catch((error) => console.error('[MARK_READ]: ', error));
    };

    mark();

    document.addEventListener('visibilitychange', mark);
    return () => document.removeEventListener('visibilitychange', mark);
  }, [markRead, workspaceId, channelId, conversationId, latestMessageId]);
};
