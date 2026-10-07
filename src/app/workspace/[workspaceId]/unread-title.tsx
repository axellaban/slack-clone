'use client';

import { useEffect } from 'react';

import { useUnreadCounts } from '@/features/reads/api/use-unread-counts';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

// shows the unread total in the browser tab, e.g. "(3) Slack Clone"
export const UnreadTitle = () => {
  const workspaceId = useWorkspaceId();
  const { data: unread } = useUnreadCounts({ workspaceId });

  const total = [...Object.values(unread?.channels ?? {}), ...Object.values(unread?.members ?? {})].reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    const title = document.title.replace(/^\(\d+\+?\) /, '');

    document.title = total > 0 ? `(${total > 99 ? '99+' : total}) ${title}` : title;
  }, [total]);

  return null;
};
