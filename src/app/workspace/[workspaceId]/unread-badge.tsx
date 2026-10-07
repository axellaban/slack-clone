import { cn } from '@/lib/utils';

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export const UnreadBadge = ({ count, className }: UnreadBadgeProps) => {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#CD2553] px-1 text-[11px] font-bold text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
