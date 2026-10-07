import { type VariantProps, cva } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { IconType } from 'react-icons/lib';

import type { Id } from '@/../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

import { UnreadBadge } from './unread-badge';

const sidebarItemVariants = cva('flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden', {
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

interface SidebarItemProps {
  id: string;
  icon: LucideIcon | IconType;
  label: Id<'channels'> | string;
  variant?: VariantProps<typeof sidebarItemVariants>['variant'];
  unreadCount?: number;
  href?: string;
}

export const SidebarItem = ({ id, icon: Icon, label, variant, unreadCount = 0, href }: SidebarItemProps) => {
  const workspaceId = useWorkspaceId();

  return (
    <Button variant="transparent" size="sm" className={cn(sidebarItemVariants({ variant }))} asChild>
      <Link href={href ?? `/workspace/${workspaceId}/channel/${id}`}>
        <Icon className="mr-1 size-3.5 shrink-0" />
        <span className={cn('truncate text-sm', unreadCount > 0 && 'font-bold text-white')}>{label}</span>

        <UnreadBadge count={unreadCount} />
      </Link>
    </Button>
  );
};
