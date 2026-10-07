import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseUnreadCountsProps {
  workspaceId: Id<'workspaces'>;
}

export const useUnreadCounts = ({ workspaceId }: UseUnreadCountsProps) => {
  const data = useQuery(api.reads.unreadCounts, { workspaceId });

  const isLoading = data === undefined;

  return { data, isLoading };
};
