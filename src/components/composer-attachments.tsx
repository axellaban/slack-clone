import { Film, Mic, XIcon } from 'lucide-react';

import { type PendingAttachment, formatDuration } from '@/features/upload/lib/attachments';
import { useObjectUrl } from '@/hooks/use-object-url';

import { Hint } from './hint';

interface ComposerAttachmentsProps {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
}

const Preview = ({ attachment }: { attachment: PendingAttachment }) => {
  const url = useObjectUrl(attachment.type === 'audio' ? null : attachment.file);

  if (attachment.type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={attachment.file.name} className="size-full object-cover" />;
  }

  if (attachment.type === 'video') {
    return (
      <div className="relative size-full bg-black">
        <video src={url} muted playsInline preload="metadata" className="size-full object-cover" />
        <Film className="absolute bottom-1 left-1 size-4 text-white drop-shadow" />
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-0.5 bg-[#1264A3]/10 text-[#1264A3]">
      <Mic className="size-5" />
      <span className="text-[10px] font-semibold">{attachment.duration ? formatDuration(attachment.duration) : 'Audio'}</span>
    </div>
  );
};

// files waiting to be sent, shown inside the composer
export const ComposerAttachments = ({ attachments, onRemove }: ComposerAttachmentsProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="group/attachment relative size-[62px]">
          <div className="size-full overflow-hidden rounded-xl border">
            <Preview attachment={attachment} />
          </div>

          <Hint label="Remove">
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.file.name}`}
              className="absolute -right-2.5 -top-2.5 z-[4] flex size-6 items-center justify-center rounded-full border-2 border-white bg-black/70 text-white hover:bg-black md:hidden md:group-hover/attachment:flex"
            >
              <XIcon className="size-3.5" />
            </button>
          </Hint>
        </div>
      ))}
    </div>
  );
};
