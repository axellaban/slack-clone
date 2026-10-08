import { ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import { useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { type AttachmentType, formatDuration } from '@/features/upload/lib/attachments';
import { cn } from '@/lib/utils';

export type MessageAttachment = {
  storageId: string;
  type: AttachmentType;
  url: string;
  name?: string;
  duration?: number;
};

interface MessageAttachmentsProps {
  attachments?: MessageAttachment[];
}

const ImageGallery = ({ images }: { images: MessageAttachment[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const single = images.length === 1;
  const current = openIndex === null ? null : images[openIndex];

  return (
    <>
      <div
        className={cn(
          'my-2 grid max-w-[480px] gap-1',
          single ? 'grid-cols-1' : images.length === 2 || images.length === 4 ? 'grid-cols-2' : 'grid-cols-3',
        )}
      >
        {images.map((image, index) => (
          <button
            key={image.storageId}
            type="button"
            onClick={() => setOpenIndex(index)}
            className={cn('cursor-zoom-in overflow-hidden rounded-lg border bg-muted', single ? 'max-w-[360px]' : 'aspect-square')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.name ?? 'Image'} loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          isThumbnail
          className="max-w-[90vw] border-none bg-transparent p-0 shadow-none md:max-w-[800px]"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{current?.name ?? 'Image'}</DialogTitle>

          {current && (
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.url} alt={current.name ?? 'Image'} className="max-h-[85vh] rounded-md object-contain" />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setOpenIndex((index) => ((index ?? 0) - 1 + images.length) % images.length)}
                    className="absolute left-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronLeft className="size-5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setOpenIndex((index) => ((index ?? 0) + 1) % images.length)}
                    className="absolute right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronRight className="size-5" />
                  </button>

                  <span className="absolute bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    {(openIndex ?? 0) + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// photos, videos and voice messages attached to a message
export const MessageAttachments = ({ attachments = [] }: MessageAttachmentsProps) => {
  if (attachments.length === 0) return null;

  const images = attachments.filter((attachment) => attachment.type === 'image');
  const videos = attachments.filter((attachment) => attachment.type === 'video');
  const audios = attachments.filter((attachment) => attachment.type === 'audio');

  return (
    <div className="flex flex-col">
      {images.length > 0 && <ImageGallery images={images} />}

      {videos.map((video) => (
        <video
          key={video.storageId}
          src={video.url}
          controls
          playsInline
          preload="metadata"
          className="my-2 max-h-[360px] w-full max-w-[360px] rounded-lg border bg-black"
        />
      ))}

      {audios.map((audio) => (
        <div key={audio.storageId} className="my-1 flex w-full max-w-[360px] items-center gap-2 rounded-lg border bg-white p-2 shadow-sm">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1264A3]/10 text-[#1264A3]">
            <Mic className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {audio.name?.startsWith('Voice message') ? 'Voice message' : (audio.name ?? 'Audio')}
              {audio.duration ? ` · ${formatDuration(audio.duration)}` : ''}
            </p>

            <audio src={audio.url} controls preload="metadata" className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
