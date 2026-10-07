'use client';

import { formatDistanceToNow } from 'date-fns';
import { Loader, MessageSquareText } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGetThreads } from '@/features/messages/api/use-get-threads';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { getChatHref } from '../chat-link';
import { PageHeader } from '../page-header';

const ThreadsPage = () => {
  const workspaceId = useWorkspaceId();
  const { data: threads, isLoading } = useGetThreads({ workspaceId });

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <MessageSquareText className="size-5" />
        Threads
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !threads?.length ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <MessageSquareText className="size-10 text-muted-foreground/60" />
          <p className="font-semibold">No threads yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Threads you start or reply to show up here, so you can keep track of conversations.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4">
          {threads.map((thread) => (
            <Link
              key={thread._id}
              href={getChatHref(workspaceId, { ...thread, threadId: thread._id }) ?? '#'}
              className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-[#1264A3]/40 hover:shadow"
            >
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {thread.channelName ? `# ${thread.channelName}` : thread.otherMemberName}
              </p>

              <div className="flex items-start gap-2">
                <Avatar className="size-8 rounded-md">
                  <AvatarImage src={thread.author?.image} />
                  <AvatarFallback className="rounded-md text-xs">{thread.author?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="text-sm font-bold">{thread.author?.name}</p>
                  <p className="line-clamp-2 text-sm">{thread.body}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs">
                <Avatar className="size-5 rounded">
                  <AvatarImage src={thread.lastReply.image} />
                  <AvatarFallback className="rounded text-[10px]">{thread.lastReply.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                <span className="font-bold text-[#1264A3]">
                  {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                </span>

                <span className="truncate text-muted-foreground">
                  {thread.lastReply.name}: {thread.lastReply.body}
                </span>

                <span className="ml-auto shrink-0 text-muted-foreground">
                  {formatDistanceToNow(thread.lastReply.timestamp, { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreadsPage;
