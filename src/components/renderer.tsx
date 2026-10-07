import Quill from 'quill';
import { useEffect, useRef, useState } from 'react';

interface RendererProps {
  value: string;
  // names that can be @mentioned, highlighted like Slack
  mentions?: string[];
  selfName?: string;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightMentions = (container: HTMLElement, mentions: string[], selfName?: string) => {
  if (mentions.length === 0) return;

  // longest names first so "@Ana María" wins over "@Ana"
  const names = [...mentions].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const regex = new RegExp(`@(${names.join('|')})(?![\\w])`, 'gi');
  const self = selfName?.toLowerCase();

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    const text = node.textContent ?? '';

    if (!regex.test(text)) continue;

    regex.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const index = match.index ?? 0;
      const name = match[1].toLowerCase();
      const span = document.createElement('span');

      span.className = name === self || ['channel', 'here', 'everyone'].includes(name) ? 'mention mention-self' : 'mention';
      span.textContent = match[0];

      fragment.append(text.slice(lastIndex, index), span);
      lastIndex = index + match[0].length;
    }

    fragment.append(text.slice(lastIndex));
    node.replaceWith(fragment);
  }
};

const Renderer = ({ value, mentions = [], selfName }: RendererProps) => {
  const [isEmpty, setIsEmpty] = useState(false);
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rendererRef.current) return;

    const container = rendererRef.current;

    const quill = new Quill(document.createElement('div'), {
      theme: 'snow',
    });

    quill.enable(false);

    const contents = JSON.parse(value);
    quill.setContents(contents);

    const isEmpty =
      quill
        .getText()
        .replace(/<(.|\n)*?>/g, '')
        .trim().length === 0;

    setIsEmpty(isEmpty);

    container.innerHTML = quill.root.innerHTML;

    highlightMentions(container, mentions, selfName);

    return () => {
      if (container) container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mentions.join('|'), selfName]);

  if (isEmpty) return null;

  return <div ref={rendererRef} className="ql-editor ql-renderer" />;
};

export default Renderer;
