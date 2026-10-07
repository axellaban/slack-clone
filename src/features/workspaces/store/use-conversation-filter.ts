'use client';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type ConversationFilter = 'all' | 'unreads';

const conversationFilterAtom = atomWithStorage<ConversationFilter>('conversation-filter', 'all');

export const useConversationFilter = () => {
  return useAtom(conversationFilterAtom);
};
