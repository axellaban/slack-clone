'use client';

import { Loader, Mic, Music, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { formatDuration } from '@/features/upload/lib/attachments';
import { cn } from '@/lib/utils';

// Voice notes are small (~4KB per second), so they are downloaded whole as soon as they scroll
// into view. Playing from memory starts instantly and avoids the many small range requests
// mobile browsers make when streaming, each one a round trip to storage.
const MAX_PREFETCH_SECONDS = 5 * 60;
const prefetched = new Map<string, Promise<string>>();

const prefetch = (url: string) => {
  if (!prefetched.has(url)) {
    const promise = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load audio (${response.status}).`);

        return response.blob();
      })
      .then((blob) => URL.createObjectURL(blob));

    promise.catch(() => prefetched.delete(url));
    prefetched.set(url, promise);
  }

  return prefetched.get(url)!;
};

const SPEEDS = [1, 1.5, 2];

interface AudioPlayerProps {
  url: string;
  name?: string;
  // seconds; known for recorded voice messages
  duration?: number;
}

export const AudioPlayer = ({ url, name, duration }: AudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [blobUrl, setBlobUrl] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState<number>();
  const [speed, setSpeed] = useState(1);

  const isVoiceMessage = !!duration;
  const canPrefetch = isVoiceMessage && duration <= MAX_PREFETCH_SECONDS;

  // recordings from Chrome don't store their length, so the browser reports Infinity
  const total = mediaDuration && Number.isFinite(mediaDuration) ? mediaDuration : (duration ?? 0);

  useEffect(() => {
    if (!canPrefetch || !containerRef.current) return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();
        prefetch(url)
          .then((objectUrl) => !cancelled && setBlobUrl(objectUrl))
          .catch(() => {});
      },
      { rootMargin: '300px' },
    );

    observer.observe(containerRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [canPrefetch, url]);

  const togglePlay = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (!audio.paused) return audio.pause();

    // play() must run synchronously in the tap handler (iOS), so if the prefetch isn't done
    // yet this falls back to streaming the original URL
    if (!audio.src) audio.src = blobUrl ?? url;

    audio.playbackRate = speed;
    audio.play().catch((error) => console.error('[AUDIO_PLAY]: ', error));
  };

  const changeSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];

    setSpeed(next);

    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const seek = (value: number) => {
    if (!audioRef.current) return;

    if (!audioRef.current.src) audioRef.current.src = blobUrl ?? url;

    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const Icon = isVoiceMessage ? Mic : Music;

  return (
    <div ref={containerRef} className="my-1 flex w-full max-w-[360px] items-center gap-2 rounded-lg border bg-white p-2 shadow-sm">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1264A3] text-white transition hover:bg-[#0b4c7c]"
      >
        {isWaiting ? (
          <Loader className="size-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="ml-0.5 size-4 fill-current" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-xs font-semibold text-muted-foreground">
          <Icon className="size-3 shrink-0" />
          {isVoiceMessage ? 'Voice message' : (name ?? 'Audio')}
        </p>

        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={Math.min(currentTime, total || 1)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          className="h-1 w-full cursor-pointer accent-[#1264A3]"
        />

        <p className="text-[11px] tabular-nums text-muted-foreground">
          {formatDuration(currentTime)} / {total ? formatDuration(total) : '--:--'}
        </p>
      </div>

      <button
        type="button"
        onClick={changeSpeed}
        aria-label="Playback speed"
        className={cn(
          'w-10 shrink-0 rounded-full border px-1.5 py-0.5 text-xs font-semibold tabular-nums',
          speed !== 1 && 'border-[#1264A3] text-[#1264A3]',
        )}
      >
        {speed}×
      </button>

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onWaiting={() => setIsWaiting(true)}
        onPlaying={() => setIsWaiting(false)}
        onCanPlay={() => setIsWaiting(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setMediaDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setMediaDuration(e.currentTarget.duration)}
      />
    </div>
  );
};
