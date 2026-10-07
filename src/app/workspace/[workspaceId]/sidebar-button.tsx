import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { IconType } from 'react-icons/lib';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarButtonProps extends ComponentProps<'button'> {
  icon: LucideIcon | IconType;
  label: string;
  isActive?: boolean;
}

export const SidebarButton = ({ icon: Icon, label, isActive = false, className, ...props }: SidebarButtonProps) => {
  return (
    <button
      type="button"
      className={cn('group flex cursor-pointer flex-col items-center justify-center gap-y-0.5 outline-none', className)}
      {...props}
    >
      <span
        className={cn(
          buttonVariants({ variant: 'transparent' }),
          'size-9 p-2 group-hover:bg-accent/20 group-focus-visible:ring-1 group-focus-visible:ring-white',
          isActive && 'bg-accent/20',
        )}
      >
        <Icon className="size-5 text-white transition-all group-hover:scale-110" />
      </span>

      <span className="text-[11px] text-white group-hover:text-accent">{label}</span>
    </button>
  );
};
