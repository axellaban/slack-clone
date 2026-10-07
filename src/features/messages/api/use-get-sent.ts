import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseGetSentProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetSent = ({ workspaceId }: UseGetSentProps) => {
  const data = useQuery(api.messages.sent, { workspaceId });

  const isLoading = data === undefined;

  return { data, isLoading };
};
