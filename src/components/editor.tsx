import { ImageIcon, Smile, XIcon } from 'lucide-react';
import Image from 'next/image';
import Quill, { type QuillOptions } from 'quill';
import type { Delta, Op } from 'quill/core';
import 'quill/dist/quill.snow.css';
import { type MutableRefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MdSend } from 'react-icons/md';
import { PiTextAa } from 'react-icons/pi';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

type EditorValue = {
  image: File | null;
  body: string;
};

interface EditorProps {
  onSubmit: ({ image, body }: EditorValue) => void;
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
  const [image, setImage] = useState<File | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<Quill | null>(null);

  const submitRef = useRef(onSubmit);
  const textChangeRef = useRef(onTextChange);
  const placeholderRef = useRef(placeholder);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);

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

                if (!imageElementRef.current || !submitRef.current) return;

                const addedImage = imageElementRef.current.files?.[0] || null;

                const isEmpty = !addedImage && text.replace(/<(.|\n)*?>/g, '').trim().length === 0;

                if (isEmpty) return;

                const body = JSON.stringify(quill.getContents());

                submitRef.current({ body, image: addedImage });
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

    quill.on(Quill.events.TEXT_CHANGE, () => {
      setText(quill.getText());
      detectMention();
      textChangeRef.current?.(JSON.stringify(quill.getContents()), quill.getText());
    });

    return () => {
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

  const isEmpty = !image && text.replace(/<(.|\n)*?>/g, '').trim().length === 0;

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

      <input type="file" accept="image/*" ref={imageElementRef} onChange={(e) => setImage(e.target.files![0])} className="hidden" />

      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition focus-within:border-slate-300 focus-within:shadow-sm',
          disabled && 'opacity-50',
        )}
      >
        <div ref={containerRef} className="h-full" />

        {!!image && (
          <div className="p-2">
            <div className="group/image relative flex size-[62px] items-center justify-center">
              <Hint label="Remove image">
                <button
                  onClick={() => {
                    setImage(null);

                    imageElementRef.current!.value = '';
                  }}
                  className="absolute -right-2.5 -top-2.5 z-[4] hidden size-6 items-center justify-center rounded-full border-2 border-white bg-black/70 text-white hover:bg-black group-hover/image:flex"
                >
                  <XIcon className="size-3.5" />
                </button>
              </Hint>

              <Image
                src={URL.createObjectURL(image)}
                alt="Uploaded image"
                fill
                className="overflow-hidden rounded-xl border object-cover"
              />
            </div>
          </div>
        )}

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
            <Hint label="Image">
              <Button disabled={disabled} size="iconSm" variant="ghost" onClick={() => imageElementRef.current?.click()}>
                <ImageIcon className="size-4" />
              </Button>
            </Hint>
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
                    image,
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
              disabled={disabled || isEmpty}
              onClick={() => {
                if (!quillRef.current) return;

                onSubmit({
                  body: JSON.stringify(quillRef.current.getContents()),
                  image,
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
