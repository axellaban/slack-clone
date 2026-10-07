'use client';

import { useEffect, useState } from 'react';

import { type Draft, listDrafts, subscribeToDrafts } from '../lib/drafts';

export const useDrafts = (workspaceId: string) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const update = () => setDrafts(listDrafts(workspaceId));

    update();

    return subscribeToDrafts(update);
  }, [workspaceId]);

  return drafts;
};
