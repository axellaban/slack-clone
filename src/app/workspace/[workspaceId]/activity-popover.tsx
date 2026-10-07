'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bell, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetActivity } from '@/features/messages/api/use-get-activity';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { SidebarButton } from './sidebar-button';

type ActivityItem = NonNullable<ReturnType<typeof useGetActivity>['data']>[number];

export const ActivityPopover = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [open, setOpen] = useState(false);

  const { data: items, isLoading } = useGetActivity({ workspaceId });

  const onItemClick = (item: ActivityItem) => {
    const path = item.channelId ? `channel/${item.channelId}` : item.otherMemberId ? `member/${item.otherMemberId}` : null;

    if (!path) return;

    setOpen(false);

    router.push(`/workspace/${workspaceId}/${path}?parentMessageId=${item.threadId}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarButton icon={Bell} label="Activity" isActive={open} />
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0"
        onFocusOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <p className="border-b px-4 py-3 text-sm font-bold">Activity</p>

        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : !items?.length ? (
          <p className="p-4 text-sm text-muted-foreground">No activity yet. Replies and reactions to your messages will show up here.</p>
        ) : (
          <div className="flex max-h-96 flex-col overflow-y-auto py-1">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => onItemClick(item)}
                className="flex items-start gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
              >
                <Avatar className="mt-0.5 size-7 shrink-0">
                  <AvatarImage alt={item.user?.name} src={item.user?.image} />
                  <AvatarFallback className="text-xs">{item.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-col">
                  <p className="truncate">
                    <span className="font-bold">{item.user?.name}</span>{' '}
                    {item.type === 'reply' ? 'replied to your message' : `reacted ${item.content} to your message`}
                    {item.channelName && <span className="text-muted-foreground"> in #{item.channelName}</span>}
                  </p>

                  {item.type === 'reply' && item.content && <p className="truncate text-muted-foreground">{item.content}</p>}

                  {item.messagePreview && <p className="truncate text-xs text-muted-foreground">&ldquo;{item.messagePreview}&rdquo;</p>}

                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
