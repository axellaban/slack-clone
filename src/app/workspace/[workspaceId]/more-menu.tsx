'use client';

import { Bell, BellOff, Hash, MoreHorizontal, Plus, Settings, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreateChannelModal } from '@/features/channels/store/use-create-channel-modal';
import { useCurrentMember } from '@/features/members/api/use-current-member';
import { usePushNotifications } from '@/features/notifications/api/use-push-notifications';
import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';
import { useCreateWorkspaceModal } from '@/features/workspaces/store/use-create-workspace-modal';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { InviteModal } from './invite-modal';
import { PreferencesModal } from './preferences-modal';
import { SidebarButton } from './sidebar-button';

export const MoreMenu = () => {
  const workspaceId = useWorkspaceId();
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const [_createChannelOpen, setCreateChannelOpen] = useCreateChannelModal();
  const [_createWorkspaceOpen, setCreateWorkspaceOpen] = useCreateWorkspaceModal();

  const { data: member } = useCurrentMember({ workspaceId });
  const { data: workspace } = useGetWorkspace({ id: workspaceId });

  const notifications = usePushNotifications();

  const isAdmin = member?.role === 'admin';

  const onToggleNotifications = async () => {
    try {
      if (notifications.isSubscribed) {
        await notifications.disable();
        toast.success('Notifications turned off on this device.');
        return;
      }

      if (notifications.permission === 'denied') {
        toast.error('Notifications are blocked. Allow them in your browser settings.');
        return;
      }

      const result = await notifications.enable();

      if (result === 'granted') toast.success('Notifications enabled.');
      else if (result === 'denied') toast.error('Notifications are blocked. Allow them in your browser settings.');
    } catch (error) {
      console.error('[TOGGLE_NOTIFICATIONS]: ', error);
      toast.error('Failed to update notifications.');
    }
  };

  return (
    <>
      {workspace && (
        <>
          <InviteModal open={inviteOpen} setOpen={setInviteOpen} name={workspace.name} joinCode={workspace.joinCode} />
          <PreferencesModal open={preferencesOpen} setOpen={setPreferencesOpen} initialValue={workspace.name} />
        </>
      )}

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarButton icon={MoreHorizontal} label="More" isActive={open} />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          className="w-60"
          onFocusOutside={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {isAdmin && workspace && (
            <>
              <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setCreateChannelOpen(true)}>
                <Hash className="mr-2 size-4" />
                Create a channel
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-2 size-4" />
                Invite people
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setPreferencesOpen(true)}>
                <Settings className="mr-2 size-4" />
                Workspace preferences
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {notifications.isAvailable && (
            <>
              <DropdownMenuItem className="cursor-pointer py-2" disabled={notifications.isPending} onClick={onToggleNotifications}>
                {notifications.isSubscribed ? <BellOff className="mr-2 size-4" /> : <Bell className="mr-2 size-4" />}
                {notifications.isSubscribed ? 'Turn off notifications' : 'Turn on notifications'}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setCreateWorkspaceOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create a new workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
