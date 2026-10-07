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
