import { Home } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { UserButton } from '@/features/auth/components/user-button';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { ActivityPopover } from './activity-popover';
import { DmsPopover } from './dms-popover';
import { MoreMenu } from './more-menu';
import { SidebarButton } from './sidebar-button';
import { WorkspaceSwitcher } from './workspace-switcher';

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();

  return (
    <aside className="flex h-full w-[70px] flex-col items-center gap-y-4 bg-[#381349] pb-[4px] pt-[9px]">
      <WorkspaceSwitcher />

      <SidebarButton
        icon={Home}
        label="Home"
        isActive={!pathname.includes('/member/')}
        onClick={() => router.push(`/workspace/${workspaceId}`)}
      />
      <DmsPopover />
      <ActivityPopover />
      <MoreMenu />

      <div className="mt-auto flex flex-col items-center justify-center gap-y-1">
        <UserButton />
      </div>
    </aside>
  );
};
