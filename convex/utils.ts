// message bodies are stored as Quill deltas
export const toPlainText = (body: string) => {
  try {
    const { ops } = JSON.parse(body) as { ops?: { insert?: unknown }[] };

    return (ops ?? [])
      .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
      .join('')
      .trim();
  } catch {
    return body;
  }
};

type AttachmentLike = { type: 'image' | 'video' | 'audio'; name?: string };

const plural = (count: number, singular: string, pluralForm = `${singular}s`) => (count === 1 ? `a ${singular}` : `${count} ${pluralForm}`);

// short description of a message for previews and notifications, e.g. "Sent 3 photos"
export const describeMessage = (message: { body: string; image?: unknown; attachments?: AttachmentLike[] }) => {
  const text = toPlainText(message.body);

  if (text) return text;

  const attachments = message.attachments ?? [];

  if (attachments.length === 0) return message.image ? 'Sent a photo' : '';

  const count = (type: AttachmentLike['type']) => attachments.filter((attachment) => attachment.type === type).length;
  const [images, videos, audios] = [count('image'), count('video'), count('audio')];

  if (audios === attachments.length) return audios === 1 ? 'Sent a voice message' : `Sent ${audios} audio files`;
  if (images === attachments.length) return `Sent ${plural(images, 'photo')}`;
  if (videos === attachments.length) return `Sent ${plural(videos, 'video')}`;

  return `Sent ${attachments.length} files`;
};
