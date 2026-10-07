import type { PropsWithChildren } from 'react';

// header for workspace pages that are not a chat (threads, drafts...)
export const PageHeader = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-[49px] shrink-0 items-center gap-2 overflow-hidden border-b bg-white px-4 text-lg font-bold">{children}</div>
  );
};
