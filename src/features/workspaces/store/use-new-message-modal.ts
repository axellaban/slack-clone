'use client';

import { atom, useAtom } from 'jotai';

const newMessageModalAtom = atom(false);

export const useNewMessageModal = () => {
  return useAtom(newMessageModalAtom);
};
