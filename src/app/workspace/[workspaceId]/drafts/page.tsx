'use client';

import { formatDistanceToNow } from 'date-fns';
import { Loader, Pencil, SendHorizonal, Trash } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useGetChannels } from '@/features/channels/api/use-get-channels';
import { useDrafts } from '@/features/drafts/api/use-drafts';
import { removeDraft } from '@/features/drafts/lib/drafts';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetSent } from '@/features/messages/api/use-get-sent';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

import { getChatHref } from '../chat-link';
import { PageHeader } from '../page-header';

const DraftsPage = () => {
  const workspaceId = useWorkspaceId();
  const [tab, setTab] = useState<'drafts' | 'sent'>('drafts');

  const drafts = useDrafts(workspaceId);
  const { data: sent, isLoading: sentLoading } = useGetSent({ workspaceId });
  const { data: channels } = useGetChannels({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  const draftLabel = (target: string, targetId: string) =>
    target === 'channel'
      ? `# ${channels?.find((channel) => channel._id === targetId)?.name ?? 'channel'}`
      : (members?.find((member) => member._id === targetId)?.user.name ?? 'Direct message');

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <SendHorizonal className="size-5" />
        Drafts & Sent
      </PageHeader>

      <div className="flex gap-4 border-b px-4">
        {(['drafts', 'sent'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              '-mb-px border-b-2 py-2 text-sm font-semibold capitalize transition',
              tab === value ? 'border-[#1264A3] text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {value}
            {value === 'drafts' && drafts.length > 0 && <span className="ml-1 text-muted-foreground">{drafts.length}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'drafts' ? (
          drafts.length === 0 ? (
            <EmptyState icon={Pencil} title="No drafts" description="Messages you start typing but don't send are saved here." />
          ) : (
            drafts.map((draft) => (
              <div key={draft.key} className="group flex items-center gap-3 border-b px-4 py-3 hover:bg-muted/50">
                <Link href={`/workspace/${workspaceId}/${draft.target}/${draft.targetId}`} className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {draftLabel(draft.target, draft.targetId)} · {formatDistanceToNow(draft.updatedAt, { addSuffix: true })}
                  </p>
                  <p className="truncate text-sm">{draft.text.trim()}</p>
                </Link>

                <Button
                  variant="ghost"
                  size="iconSm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => removeDraft(draft.key)}
                  aria-label="Delete draft"
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            ))
          )
        ) : sentLoading ? (
          <div className="flex justify-center p-6">
            <Loader className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !sent?.length ? (
          <EmptyState icon={SendHorizonal} title="Nothing sent yet" description="Messages you send show up here." />
        ) : (
          sent.map((message) => (
            <Link
              key={message._id}
              href={getChatHref(workspaceId, { ...message, threadId: message.parentMessageId }) ?? '#'}
              className="block border-b px-4 py-3 hover:bg-muted/50"
            >
              <p className="text-xs font-semibold text-muted-foreground">
                {message.channelName ? `# ${message.channelName}` : message.otherMemberName}
                {message.parentMessageId && ' · in a thread'} · {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </p>
              <p className="truncate text-sm">{message.body}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }: { icon: typeof Pencil; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
    <Icon className="size-10 text-muted-foreground/60" />
    <p className="font-semibold">{title}</p>
    <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
  </div>
);

export default DraftsPage;
