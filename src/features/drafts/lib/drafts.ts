// Unsent messages are kept per chat in localStorage, like Slack drafts.

export type DraftTarget = 'channel' | 'member';

export type Draft = {
  key: string;
  workspaceId: string;
  target: DraftTarget;
  targetId: string;
  body: string;
  text: string;
  updatedAt: number;
};

const PREFIX = 'draft:';
const CHANGE_EVENT = 'drafts-change';

export const getDraftKey = (workspaceId: string, target: DraftTarget, targetId: string) => `${PREFIX}${workspaceId}:${target}:${targetId}`;

export const getDraft = (key: string): Draft | null => {
  try {
    const value = localStorage.getItem(key);

    return value ? (JSON.parse(value) as Draft) : null;
  } catch {
    return null;
  }
};

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export const removeDraft = (key: string) => {
  try {
    localStorage.removeItem(key);
    notify();
  } catch {}
};

export const saveDraft = (draft: Omit<Draft, 'key' | 'updatedAt'>) => {
  const key = getDraftKey(draft.workspaceId, draft.target, draft.targetId);

  if (!draft.text.trim()) return removeDraft(key);

  try {
    localStorage.setItem(key, JSON.stringify({ ...draft, key, updatedAt: Date.now() }));
    notify();
  } catch {}
};

export const listDrafts = (workspaceId: string) => {
  const drafts: Draft[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key?.startsWith(`${PREFIX}${workspaceId}:`)) continue;

      const draft = getDraft(key);

      if (draft) drafts.push(draft);
    }
  } catch {}

  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const subscribeToDrafts = (callback: () => void) => {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};
