'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// formats browsers can record, in order of preference (Safari only supports mp4)
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

const getMimeType = () => MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';

export const isVoiceRecordingSupported = () =>
  typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    setIsRecording(false);
    setSeconds(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const mimeType = getMimeType();
    // voice needs far less than the ~128kbps browsers use by default: smaller files load faster on mobile
    const recorder = new MediaRecorder(stream, {
      ...(mimeType && { mimeType }),
      audioBitsPerSecond: mimeType.includes('mp4') ? 48_000 : 32_000,
    });

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.start(250);
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setIsRecording(true);
    setSeconds(0);

    timerRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000)), 250);
  }, []);

  // resolves with the recording as a file, plus its length in seconds
  const stop = useCallback(() => {
    const recorder = recorderRef.current;

    if (!recorder) return Promise.resolve(null);

    return new Promise<{ file: File; duration: number } | null>((resolve) => {
      recorder.onstop = () => {
        const duration = (Date.now() - startedAtRef.current) / 1000;
        const type = recorder.mimeType || 'audio/webm';
        const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(chunksRef.current, { type });

        cleanup();
        resolve(blob.size > 0 ? { file: new File([blob], `Voice message.${extension}`, { type }), duration } : null);
      };

      recorder.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder) {
      recorder.onstop = null;

      if (recorder.state !== 'inactive') recorder.stop();
    }

    cleanup();
  }, [cleanup]);

  return { isRecording, seconds, start, stop, cancel };
};
