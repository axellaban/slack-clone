'use client';

import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Loader } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type PropsWithChildren, useEffect } from 'react';
import { type LayoutStorage, useDefaultLayout } from 'react-resizable-panels';
import { useMedia } from 'react-use';

import type { Id } from '@/../convex/_generated/dataModel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Profile } from '@/features/members/components/profile';
import { Thread } from '@/features/messages/components/thread';
import { NotificationsBanner } from '@/features/notifications/components/notifications-banner';
import { useMobileNav } from '@/features/workspaces/store/use-mobile-nav';
import { usePanel } from '@/hooks/use-panel';

import { NewMessageDialog } from './new-message-dialog';
import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { UnreadTitle } from './unread-title';
import { WorkspaceSidebar } from './workspace-sidebar';

// localStorage only exists in the browser; during server rendering fall back to the default layout
const layoutStorage: LayoutStorage = {
  getItem: (key) => (typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
};

const WorkspaceIdLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const pathname = usePathname();
  const { parentMessageId, profileMemberId, onClose } = usePanel();
  const [mobileNavOpen, setMobileNavOpen] = useMobileNav();

  const isDesktop = useMedia('(min-width: 768px)', true);

  const showPanel = !!parentMessageId || !!profileMemberId;

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: 'slack-clone-workspace-layout',
    panelIds: showPanel ? ['sidebar', 'main', 'panel'] : ['sidebar', 'main'],
    storage: layoutStorage,
  });

  // close the mobile drawer after navigating somewhere
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const panel = parentMessageId ? (
    <Thread messageId={parentMessageId as Id<'messages'>} onClose={onClose} />
  ) : profileMemberId ? (
    <Profile memberId={profileMemberId as Id<'members'>} onClose={onClose} />
  ) : (
    <div className="flex h-full items-center justify-center">
      <Loader className="size-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="flex h-dvh flex-col">
      <UnreadTitle />
      <NewMessageDialog />
      <NotificationsBanner />
      <Toolbar />

      {isDesktop ? (
        <div className="flex min-h-0 flex-1">
          <Sidebar />

          <ResizablePanelGroup orientation="horizontal" defaultLayout={defaultLayout} onLayoutChange={onLayoutChange}>
            <ResizablePanel id="sidebar" defaultSize="20%" minSize="11%" className="bg-[#5E2C5F]">
              <WorkspaceSidebar />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel id="main" defaultSize="80%" minSize="20%">
              {children}
            </ResizablePanel>

            {showPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="panel" minSize="20%" defaultSize="29%">
                  {panel}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          {children}

          {showPanel && <div className="absolute inset-0 z-20 bg-white">{panel}</div>}

          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent className="flex w-[85vw] max-w-[360px]" aria-describedby={undefined}>
              <VisuallyHidden.Root>
                <SheetTitle>Navigation</SheetTitle>
              </VisuallyHidden.Root>

              <Sidebar />

              <div className="min-w-0 flex-1">
                <WorkspaceSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
};

export default WorkspaceIdLayout;
