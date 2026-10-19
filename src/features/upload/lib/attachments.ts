import type { Id } from '@/../convex/_generated/dataModel';

export type AttachmentType = 'image' | 'video' | 'audio' | 'file';

// a file picked, pasted, dropped or recorded in the composer, not uploaded yet
export type PendingAttachment = {
  id: string;
  file: File;
  type: AttachmentType;
  // seconds, for voice messages
  duration?: number;
};

export type UploadedAttachment = {
  storageId: Id<'_storage'>;
  type: AttachmentType;
  name?: string;
  duration?: number;
  size?: number;
};

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024;

// photos, videos and audio get players; anything else (PDF, docs, sheets, zips...) is a downloadable file
export const getAttachmentType = (file: File): AttachmentType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';

  return 'file';
};

export const uploadAttachments = async (
  attachments: PendingAttachment[],
  generateUploadUrl: () => Promise<string | null | undefined>,
): Promise<UploadedAttachment[]> => {
  return Promise.all(
    attachments.map(async ({ file, type, duration }) => {
      const url = await generateUploadUrl();

      if (!url) throw new Error('URL not found.');

      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      if (!result.ok) throw new Error(`Failed to upload ${file.name}.`);

      const { storageId } = (await result.json()) as { storageId: Id<'_storage'> };

      return { storageId, type, name: file.name, duration, size: type === 'file' ? file.size : undefined };
    }),
  );
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const getFileExtension = (name?: string) => {
  const extension = name?.includes('.') ? name.split('.').pop() : undefined;

  return extension ? extension.slice(0, 4).toUpperCase() : 'FILE';
};

export const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));

  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
