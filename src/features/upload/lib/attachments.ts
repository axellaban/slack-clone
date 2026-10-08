import type { Id } from '@/../convex/_generated/dataModel';

export type AttachmentType = 'image' | 'video' | 'audio';

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
};

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024;

export const getAttachmentType = (file: File): AttachmentType | null => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';

  return null;
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

      return { storageId, type, name: file.name, duration };
    }),
  );
};

export const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));

  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
