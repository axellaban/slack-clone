import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseGetThreadsProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetThreads = ({ workspaceId }: UseGetThreadsProps) => {
  const data = useQuery(api.messages.threads, { workspaceId });

  const isLoading = data === undefined;

  return { data, isLoading };
};
