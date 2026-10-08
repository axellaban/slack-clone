'use client';

import { Loader } from 'lucide-react';
import dynamic from 'next/dynamic';
import type Quill from 'quill';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import type { Id } from '@/../convex/_generated/dataModel';
import type { EditorValue } from '@/components/editor';
import { getDraft, getDraftKey, removeDraft, saveDraft } from '@/features/drafts/lib/drafts';
import { useMentionOptions } from '@/features/members/api/use-mention-options';
import { useCreateMessage } from '@/features/messages/api/use-create-message';
import { useGenerateUploadUrl } from '@/features/upload/api/use-generate-upload-url';
import { type UploadedAttachment, uploadAttachments } from '@/features/upload/lib/attachments';
import { useChannelId } from '@/hooks/use-channel-id';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

const Editor = dynamic(() => import('@/components/editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface ChatInputProps {
  placeholder?: string;
}

type CreateMessageValues = {
  channelId: Id<'channels'>;
  workspaceId: Id<'workspaces'>;
  body: string;
  attachments?: UploadedAttachment[];
};

export const ChatInput = ({ placeholder }: ChatInputProps) => {
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const innerRef = useRef<Quill | null>(null);

  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();

  const { mutate: createMessage } = useCreateMessage();
  const mentions = useMentionOptions({ includeChannel: true });

  const draftKey = getDraftKey(workspaceId, 'channel', channelId);
  const draft = typeof window === 'undefined' ? null : getDraft(draftKey);
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  const handleSubmit = async ({ body, attachments }: EditorValue) => {
    try {
      setIsPending(true);
      innerRef.current?.enable(false);

      const values: CreateMessageValues = {
        channelId,
        workspaceId,
        body,
      };

      if (attachments.length > 0) {
        values.attachments = await uploadAttachments(attachments, () => generateUploadUrl({}, { throwError: true }));
      }

      await createMessage(values, { throwError: true });

      removeDraft(draftKey);

      setEditorKey((prevKey) => prevKey + 1);
    } catch (error) {
      toast.error('Failed to send message.');
    } finally {
      setIsPending(false);
      innerRef?.current?.enable(true);
    }
  };

  return (
    <div className="w-full px-5">
      <Editor
        placeholder={placeholder}
        key={`${draftKey}-${editorKey}`}
        defaultValue={draft ? JSON.parse(draft.body).ops : []}
        onTextChange={(body, text) => saveDraft({ workspaceId, target: 'channel', targetId: channelId, body, text })}
        onSubmit={handleSubmit}
        disabled={isPending}
        innerRef={innerRef}
        mentions={mentions}
      />
    </div>
  );
};
