'use client';

import { Loader } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { type LayoutStorage, useDefaultLayout } from 'react-resizable-panels';

import type { Id } from '@/../convex/_generated/dataModel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Profile } from '@/features/members/components/profile';
import { Thread } from '@/features/messages/components/thread';
import { NotificationsBanner } from '@/features/notifications/components/notifications-banner';
import { usePanel } from '@/hooks/use-panel';

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
  const { parentMessageId, profileMemberId, onClose } = usePanel();

  const showPanel = !!parentMessageId || !!profileMemberId;

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: 'slack-clone-workspace-layout',
    panelIds: showPanel ? ['sidebar', 'main', 'panel'] : ['sidebar', 'main'],
    storage: layoutStorage,
  });

  return (
    <div className="flex h-screen flex-col">
      <UnreadTitle />
      <NotificationsBanner />
      <Toolbar />

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
                {parentMessageId ? (
                  <Thread messageId={parentMessageId as Id<'messages'>} onClose={onClose} />
                ) : profileMemberId ? (
                  <Profile memberId={profileMemberId as Id<'members'>} onClose={onClose} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WorkspaceIdLayout;
