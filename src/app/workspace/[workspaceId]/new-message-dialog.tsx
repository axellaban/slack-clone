'use client';

import { HashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useGetChannels } from '@/features/channels/api/use-get-channels';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useNewMessageModal } from '@/features/workspaces/store/use-new-message-modal';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

// "New message": pick a person or channel to write to
export const NewMessageDialog = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [open, setOpen] = useNewMessageModal();

  const { data: channels } = useGetChannels({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  const go = (path: string) => {
    setOpen(false);

    router.push(`/workspace/${workspaceId}/${path}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="To: type the name of a person or channel" />

      <CommandList>
        <CommandEmpty>No people or channels found.</CommandEmpty>

        <CommandGroup heading="People">
          {members?.map((member) => (
            <CommandItem key={member._id} value={`person ${member.user.name}`} onSelect={() => go(`member/${member._id}`)}>
              <Avatar className="mr-2 size-5 rounded">
                <AvatarImage src={member.user.image} />
                <AvatarFallback className="rounded text-[10px]">{member.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {member.user.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Channels">
          {channels?.map((channel) => (
            <CommandItem key={channel._id} value={`channel ${channel.name}`} onSelect={() => go(`channel/${channel._id}`)}>
              <HashIcon className="mr-2 size-4" />
              {channel.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
