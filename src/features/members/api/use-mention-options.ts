import { useMemo } from 'react';

import type { MentionOption } from '@/components/editor';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { useCurrentMember } from './use-current-member';
import { useGetMembers } from './use-get-members';

const CHANNEL_MENTIONS: MentionOption[] = [
  { id: 'channel', name: 'channel', description: 'Notify everyone in this channel' },
  { id: 'here', name: 'here', description: 'Notify everyone in this channel' },
];

// people (and, in channels, @channel / @here) that can be @mentioned
export const useMentionOptions = ({ includeChannel = false } = {}) => {
  const workspaceId = useWorkspaceId();
  const { data: members } = useGetMembers({ workspaceId });
  const { data: currentMember } = useCurrentMember({ workspaceId });

  return useMemo(() => {
    const people: MentionOption[] = (members ?? [])
      .filter((member) => member._id !== currentMember?._id && !!member.user.name)
      .map((member) => ({ id: member._id, name: member.user.name!, image: member.user.image }));

    return includeChannel ? [...people, ...CHANNEL_MENTIONS] : people;
  }, [members, currentMember?._id, includeChannel]);
};

// names to highlight as mentions when rendering messages
export const useMentionNames = () => {
  const workspaceId = useWorkspaceId();
  const { data: members } = useGetMembers({ workspaceId });

  return useMemo(
    () => [...(members ?? []).flatMap((member) => (member.user.name ? [member.user.name] : [])), 'channel', 'here', 'everyone'],
    [members],
  );
};
