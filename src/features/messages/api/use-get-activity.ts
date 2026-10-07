import { useQuery } from 'convex/react';

import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

interface UseGetActivityProps {
  workspaceId: Id<'workspaces'>;
}

export const useGetActivity = ({ workspaceId }: UseGetActivityProps) => {
  const data = useQuery(api.messages.activity, { workspaceId });

  const isLoading = data === undefined;

  return { data, isLoading };
};
