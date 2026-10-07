'use client';

import { Check, ChevronDown, ListFilter, SquarePen } from 'lucide-react';
import { useState } from 'react';

import { Doc } from '@/../convex/_generated/dataModel';
import { Hint } from '@/components/hint';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConversationFilter } from '@/features/workspaces/store/use-conversation-filter';
import { useNewMessageModal } from '@/features/workspaces/store/use-new-message-modal';

import { InviteModal } from './invite-modal';
import { PreferencesModal } from './preferences-modal';

interface WorkspaceHeaderProps {
  workspace: Doc<'workspaces'>;
  isAdmin: boolean;
}

export const WorkspaceHeader = ({ workspace, isAdmin }: WorkspaceHeaderProps) => {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [_newMessageOpen, setNewMessageOpen] = useNewMessageModal();
  const [filter, setFilter] = useConversationFilter();

  return (
    <>
      <PreferencesModal open={preferencesOpen} setOpen={setPreferencesOpen} initialValue={workspace.name} />
      <InviteModal open={inviteOpen} setOpen={setInviteOpen} name={workspace.name} joinCode={workspace.joinCode} />

      <div className="flex h-[49px] items-center justify-between gap-0.5 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="transparent" className="w-auto overflow-hidden p-1.5 text-lg font-semibold" size="sm">
              <span className="truncate">{workspace.name}</span>
              <ChevronDown className="ml-1 size-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="start" className="w-64">
            <DropdownMenuItem className="cursor-pointer capitalize">
              <div className="relative mr-2 flex size-9 items-center justify-center overflow-hidden rounded-md bg-[#616061] text-xl font-semibold text-white">
                {workspace.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col items-start">
                <p className="font-bold">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">Active workspace</p>
              </div>
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setInviteOpen(true)}>
                  Invite people to {workspace.name}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setPreferencesOpen(true)}>
                  Preferences
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <Hint label="Filter conversations" side="bottom">
              <DropdownMenuTrigger asChild>
                <Button variant="transparent" size="iconSm" className={filter === 'unreads' ? 'bg-accent/20' : undefined}>
                  <ListFilter className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </Hint>

            <DropdownMenuContent side="bottom" align="end" className="w-52">
              <DropdownMenuLabel>Show conversations</DropdownMenuLabel>

              {(['all', 'unreads'] as const).map((value) => (
                <DropdownMenuItem key={value} className="cursor-pointer" onClick={() => setFilter(value)}>
                  <Check className={filter === value ? 'mr-2 size-4' : 'mr-2 size-4 opacity-0'} />
                  {value === 'all' ? 'All conversations' : 'Unreads only'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Hint label="New message" side="bottom">
            <Button variant="transparent" size="iconSm" onClick={() => setNewMessageOpen(true)}>
              <SquarePen className="size-4" />
            </Button>
          </Hint>
        </div>
      </div>
    </>
  );
};
