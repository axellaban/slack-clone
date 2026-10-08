import { Check, Mic, Paperclip, Smile, Trash2 } from 'lucide-react';
import Quill, { type QuillOptions } from 'quill';
import type { Delta, Op } from 'quill/core';
import 'quill/dist/quill.snow.css';
import { type MutableRefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MdSend } from 'react-icons/md';
import { PiTextAa } from 'react-icons/pi';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  type PendingAttachment,
  formatDuration,
  getAttachmentType,
} from '@/features/upload/lib/attachments';
import { isVoiceRecordingSupported, useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { cn } from '@/lib/utils';

import { ComposerAttachments } from './composer-attachments';
import { EmojiPopover } from './emoji-popover';
import { Hint } from './hint';

export type MentionOption = {
  id: string;
  name: string;
  image?: string;
  description?: string;
};

const MAX_MENTION_RESULTS = 6;

// "@" followed by up to two words right before the cursor
const MENTION_REGEX = /(?:^|\s)@([^\s@]*(?: [^\s@]*)?)$/;

export type EditorValue = {
  attachments: PendingAttachment[];
  body: string;
};

interface EditorProps {
  onSubmit: ({ attachments, body }: EditorValue) => void;
  onCancel?: () => void;
  onTextChange?: (body: string, text: string) => void;
  placeholder?: string;
  defaultValue?: Delta | Op[];
  disabled?: boolean;
  innerRef?: MutableRefObject<Quill | null>;
  variant?: 'create' | 'update';
  mentions?: MentionOption[];
}

const Editor = ({
  onCancel,
  onSubmit,
  onTextChange,
  placeholder = 'Write something...',
  defaultValue = [],
  disabled = false,
  innerRef,
  variant = 'create',
  mentions = [],
}: EditorProps) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [canRecord, setCanRecord] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  const recorder = useVoiceRecorder();

  useEffect(() => setCanRecord(isVoiceRecordingSupported()), []);

  const addFiles = useCallback((files: File[], duration?: number) => {
    const accepted: PendingAttachment[] = [];

    for (const file of files) {
      const type = getAttachmentType(file);

      if (!type) {
        toast.error(`${file.name}: only photos, videos and audio can be attached.`);
        continue;
      }

      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`${file.name} is larger than ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB.`);
        continue;
      }

      accepted.push({ id: crypto.randomUUID(), file, type, duration });
    }

    const room = MAX_ATTACHMENTS - attachmentsRef.current.length;

    if (accepted.length > room) toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);

    if (room > 0 && accepted.length > 0) setAttachments((current) => [...current, ...accepted.slice(0, room)]);
  }, []);

  const removeAttachment = (id: string) => setAttachments((current) => current.filter((attachment) => attachment.id !== id));

  const onStartRecording = async () => {
    try {
      await recorder.start();
    } catch (error) {
      console.error('[VOICE_RECORDING]: ', error);
      toast.error('Could not access the microphone. Allow it in your browser settings.');
    }
  };

  const onStopRecording = async () => {
    const recording = await recorder.stop();

    if (recording) addFiles([recording.file], recording.duration);
  };
  const quillRef = useRef<Quill | null>(null);

  const submitRef = useRef(onSubmit);
  const textChangeRef = useRef(onTextChange);
  const placeholderRef = useRef(placeholder);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);
  const variantRef = useRef(variant);
  const addFilesRef = useRef<(files: File[]) => void>(() => {});

  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [activeMention, setActiveMention] = useState(0);

  const mentionsRef = useRef(mentions);
  const mentionKeyRef = useRef<(action: 'up' | 'down' | 'select' | 'close') => boolean>(() => false);

  const mentionResults = useMemo(() => {
    if (!mention) return [];

    const query = mention.query.toLowerCase();

    return mentions
      .filter(
        (option) =>
          option.name
            .toLowerCase()
            .split(' ')
            .some((word) => word.startsWith(query)) || option.name.toLowerCase().startsWith(query),
      )
      .slice(0, MAX_MENTION_RESULTS);
  }, [mention, mentions]);

  const insertMention = (option: MentionOption) => {
    const quill = quillRef.current;

    if (!quill || !mention) return;

    const index = quill.getSelection(true).index;

    quill.deleteText(mention.start, index - mention.start, 'user');
    quill.insertText(mention.start, `@${option.name} `, 'user');
    quill.setSelection(mention.start + option.name.length + 2, 0, 'user');

    setMention(null);
  };

  useLayoutEffect(() => {
    submitRef.current = onSubmit;
    textChangeRef.current = onTextChange;
    placeholderRef.current = placeholder;
    defaultValueRef.current = defaultValue;
    disabledRef.current = disabled;
    variantRef.current = variant;
    addFilesRef.current = addFiles;
    mentionsRef.current = mentions;

    mentionKeyRef.current = (action) => {
      if (!mention || mentionResults.length === 0) return false;

      if (action === 'up') setActiveMention((current) => (current - 1 + mentionResults.length) % mentionResults.length);
      if (action === 'down') setActiveMention((current) => (current + 1) % mentionResults.length);
      if (action === 'select') insertMention(mentionResults[Math.min(activeMention, mentionResults.length - 1)]);
      if (action === 'close') setMention(null);

      return true;
    };
  });

  useEffect(() => {
    setActiveMention(0);
  }, [mention?.query]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const editorContainer = container.appendChild(container.ownerDocument.createElement('div'));

    const options: QuillOptions = {
      modules: {
        toolbar: [
          ['bold', 'italic', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
        ],
        keyboard: {
          bindings: {
            mentionUp: {
              key: 'ArrowUp',
              handler: () => !mentionKeyRef.current('up'),
            },
            mentionDown: {
              key: 'ArrowDown',
              handler: () => !mentionKeyRef.current('down'),
            },
            mentionClose: {
              key: 'Escape',
              handler: () => !mentionKeyRef.current('close'),
            },
            tab: {
              key: 'Tab',
              handler: () => !mentionKeyRef.current('select'),
            },
            enter: {
              key: 'Enter',
              handler: () => {
                if (mentionKeyRef.current('select')) return;

                const text = quill.getText();

                if (!submitRef.current) return;

                const addedAttachments = attachmentsRef.current;

                const isEmpty = addedAttachments.length === 0 && text.replace(/<(.|\n)*?>/g, '').trim().length === 0;

                if (isEmpty) return;

                const body = JSON.stringify(quill.getContents());

                submitRef.current({ body, attachments: addedAttachments });
              },
            },
            shift_enter: {
              key: 'Enter',
              shiftKey: true,
              handler: () => {
                quill.insertText(quill.getSelection()?.index || 0, '\n');
              },
            },
          },
        },
      },
      placeholder: placeholderRef.current,
      theme: 'snow',
    };

    const quill = new Quill(editorContainer, options);

    quillRef.current = quill;
    quillRef.current.focus();

    if (innerRef) innerRef.current = quill;

    quill.setContents(defaultValueRef.current);
    setText(quill.getText());

    const detectMention = () => {
      const range = quill.getSelection();

      if (!range || range.length > 0 || mentionsRef.current.length === 0) return setMention(null);

      const start = Math.max(0, range.index - 50);
      const match = MENTION_REGEX.exec(quill.getText(start, range.index - start));

      setMention(match ? { query: match[1], start: range.index - match[1].length - 1 } : null);
    };

    quill.on(Quill.events.SELECTION_CHANGE, detectMention);

    // pasted files become attachments instead of inline images in the text
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);

      if (files.length === 0 || variantRef.current !== 'create') return;

      event.preventDefault();
      event.stopPropagation();
      addFilesRef.current(files);
    };

    container.addEventListener('paste', onPaste, true);

    quill.on(Quill.events.TEXT_CHANGE, () => {
      setText(quill.getText());
      detectMention();
      textChangeRef.current?.(JSON.stringify(quill.getContents()), quill.getText());
    });

    return () => {
      container.removeEventListener('paste', onPaste, true);

      if (container) container.innerHTML = '';

      quill.off(Quill.events.TEXT_CHANGE);
      quill.off(Quill.events.SELECTION_CHANGE);

      if (quillRef) quillRef.current = null;
      if (innerRef) innerRef.current = null;
    };
  }, [innerRef]);

  const toggleToolbar = () => {
    setIsToolbarVisible((current) => !current);

    const toolbarElement = containerRef.current?.querySelector('.ql-toolbar');

    if (toolbarElement) toolbarElement.classList.toggle('hidden');
  };

  const onEmojiSelect = (emoji: string) => {
    const quill = quillRef.current;

    if (!quill) return;

    quill.insertText(quill.getSelection()?.index || 0, emoji);
  };

  const isIOS = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);

  const isEmpty = attachments.length === 0 && text.replace(/<(.|\n)*?>/g, '').trim().length === 0;

  return (
    <div className="relative flex flex-col">
      {mention && mentionResults.length > 0 && (
        <div
          className="absolute bottom-full left-0 z-50 mb-1 w-72 overflow-hidden rounded-md border bg-white py-1 shadow-lg"
          role="listbox"
        >
          {mentionResults.map((option, index) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={index === activeMention}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(option);
              }}
              onMouseEnter={() => setActiveMention(index)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                index === activeMention && 'bg-[#1264A3] text-white',
              )}
            >
              <Avatar className="size-5 rounded">
                <AvatarImage src={option.image} />
                <AvatarFallback className="rounded text-[10px] text-foreground">{option.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <span className="truncate font-medium">{option.name}</span>

              {option.description && (
                <span className={cn('truncate text-xs', index === activeMention ? 'text-white/80' : 'text-muted-foreground')}>
                  {option.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <input
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        ref={fileInputRef}
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          if (variant !== 'create' || !e.dataTransfer.types.includes('Files')) return;

          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (variant !== 'create' || e.dataTransfer.files.length === 0) return;

          e.preventDefault();
          setIsDragging(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          'flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition focus-within:border-slate-300 focus-within:shadow-sm',
          disabled && 'opacity-50',
          isDragging && 'border-dashed border-[#1264A3] bg-[#1264A3]/5',
        )}
      >
        <div ref={containerRef} className="h-full" />

        <ComposerAttachments attachments={attachments} onRemove={removeAttachment} />

        <div className="z-[5] flex px-2 pb-2">
          <Hint label={isToolbarVisible ? 'Hide formatting' : 'Show formatting'}>
            <Button disabled={disabled} size="iconSm" variant="ghost" onClick={toggleToolbar}>
              <PiTextAa className="size-4" />
            </Button>
          </Hint>

          <EmojiPopover onEmojiSelect={onEmojiSelect}>
            <Button disabled={disabled} size="iconSm" variant="ghost">
              <Smile className="size-4" />
            </Button>
          </EmojiPopover>

          {variant === 'create' && (
            <Hint label="Attach photos, videos or audio">
              <Button disabled={disabled} size="iconSm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="size-4" />
              </Button>
            </Hint>
          )}

          {variant === 'create' && canRecord && (
            <Hint label="Record a voice message">
              <Button disabled={disabled || recorder.isRecording} size="iconSm" variant="ghost" onClick={onStartRecording}>
                <Mic className="size-4" />
              </Button>
            </Hint>
          )}

          {recorder.isRecording && (
            <div className="ml-2 flex items-center gap-2 rounded-md bg-red-50 px-2 text-sm text-red-600">
              <span className="size-2 animate-pulse rounded-full bg-red-600" />
              <span className="tabular-nums">{formatDuration(recorder.seconds)}</span>

              <Hint label="Discard">
                <Button size="iconSm" variant="ghost" onClick={recorder.cancel} aria-label="Discard recording">
                  <Trash2 className="size-4" />
                </Button>
              </Hint>

              <Hint label="Finish recording">
                <Button size="iconSm" variant="ghost" onClick={onStopRecording} aria-label="Finish recording">
                  <Check className="size-4" />
                </Button>
              </Hint>
            </div>
          )}

          {variant === 'update' && (
            <div className="ml-auto flex items-center gap-x-2">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
                Cancel
              </Button>

              <Button
                disabled={disabled || isEmpty}
                onClick={() => {
                  if (!quillRef.current) return;

                  onSubmit({
                    body: JSON.stringify(quillRef.current.getContents()),
                    attachments,
                  });
                }}
                size="sm"
                className="bg-[#007a5a] text-white hover:bg-[#007a5a]/80"
              >
                Save
              </Button>
            </div>
          )}

          {variant === 'create' && (
            <Button
              title="Send Message"
              disabled={disabled || isEmpty || recorder.isRecording}
              onClick={() => {
                if (!quillRef.current) return;

                onSubmit({
                  body: JSON.stringify(quillRef.current.getContents()),
                  attachments,
                });
              }}
              className={cn(
                'ml-auto',
                isEmpty ? 'bg-white text-muted-foreground hover:bg-white/80' : 'bg-[#007a5a] text-white hover:bg-[#007a5a]/80',
              )}
              size="iconSm"
            >
              <MdSend className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {variant === 'create' && (
        <div className={cn('flex justify-end p-2 text-[10px] text-muted-foreground opacity-0 transition', !isEmpty && 'opacity-100')}>
          <p>
            <strong>Shift + {isIOS ? 'Return' : 'Enter'}</strong> to add a new line.
          </p>
        </div>
      )}
    </div>
  );
};

export default Editor;
