import { type VariantProps, cva } from 'class-variance-authority';
import Link from 'next/link';

import type { Id } from '@/../convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

import { UnreadBadge } from './unread-badge';

const userItemVariants = cva('flex items-center gap-1.5 justify-start font-normal h-7 px-4 text-sm overflow-hidden', {
  variants: {
    variant: {
      default: 'text-[#f9EDFFCC]',
      active: 'text-[#481349] bg-white/90 hover:bg-white/90',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface UserItemProps {
  id: Id<'members'>;
  label?: string;
  image?: string;
  variant?: VariantProps<typeof userItemVariants>['variant'];
  unreadCount?: number;
}

export const UserItem = ({ id, label = 'Member', image, variant, unreadCount = 0 }: UserItemProps) => {
  const workspaceId = useWorkspaceId();
  const avatarFallback = label.charAt(0).toUpperCase();

  return (
    <Button variant="transparent" className={cn(userItemVariants({ variant }))} size="sm" asChild>
      <Link href={`/workspace/${workspaceId}/member/${id}`}>
        <Avatar className="mr-1 size-5">
          <AvatarImage alt={label} src={image} />

          <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
        </Avatar>

        <span className={cn('truncate text-sm', unreadCount > 0 && 'font-bold text-white')}>{label}</span>

        <UnreadBadge count={unreadCount} />
      </Link>
    </Button>
  );
};
