'use client';

import { useEffect, useState } from 'react';

// temporary URL for previewing a local file; created and revoked in the same effect so it
// stays valid when React re-runs effects
export const useObjectUrl = (file: Blob | null | undefined) => {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!file) return setUrl(undefined);

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
};
