'use client';

import { Loader, MessagesSquare } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Id } from '@/../convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrentMember } from '@/features/members/api/use-current-member';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useUnreadCounts } from '@/features/reads/api/use-unread-counts';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { SidebarButton } from './sidebar-button';
import { UnreadBadge } from './unread-badge';

export const DmsPopover = () => {
  const router = useRouter();
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();
  const [open, setOpen] = useState(false);

  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: members, isLoading } = useGetMembers({ workspaceId });
  const { data: unread } = useUnreadCounts({ workspaceId });

  const totalUnread = Object.values(unread?.members ?? {}).reduce((total, count) => total + count, 0);

  const onMemberClick = (memberId: Id<'members'>) => {
    setOpen(false);

    router.push(`/workspace/${workspaceId}/member/${memberId}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarButton
          icon={MessagesSquare}
          label="DMs"
          isActive={open || pathname.includes('/member/')}
          badge={totalUnread > 0 && <UnreadBadge count={totalUnread} className="absolute -right-1 -top-1 ml-0" />}
        />
      </PopoverTrigger>

      <PopoverContent side="right" align="start" className="w-72 p-0" onFocusOutside={(e) => e.preventDefault()}>
        <p className="border-b px-4 py-3 text-sm font-bold">Direct messages</p>

        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex max-h-80 flex-col overflow-y-auto py-1">
            {members?.map((member) => (
              <button
                key={member._id}
                type="button"
                onClick={() => onMemberClick(member._id)}
                className="flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
              >
                <Avatar className="size-6">
                  <AvatarImage alt={member.user.name} src={member.user.image} />
                  <AvatarFallback className="text-xs">{member.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                <span className="truncate">{member.user.name}</span>

                {member._id === currentMember?._id && <span className="text-xs text-muted-foreground">(you)</span>}

                <UnreadBadge count={unread?.members[member._id] ?? 0} />
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
