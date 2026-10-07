'use client';

import { atom, useAtom } from 'jotai';

const mobileNavAtom = atom(false);

export const useMobileNav = () => {
  return useAtom(mobileNavAtom);
};
