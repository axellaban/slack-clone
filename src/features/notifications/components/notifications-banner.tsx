'use client';

import { BellRing, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { usePushNotifications } from '../api/use-push-notifications';

const DISMISSED_KEY = 'notifications-banner-dismissed';

export const NotificationsBanner = () => {
  const { isAvailable, permission, isPending, enable } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    try {
      setIsDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
    } catch {
      setIsDismissed(false);
    }
  }, []);

  if (!isAvailable || permission !== 'default' || isDismissed) return null;

  const onDismiss = () => {
    setIsDismissed(true);

    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {}
  };

  const onEnable = async () => {
    try {
      const result = await enable();

      if (result === 'granted') toast.success('Notifications enabled.');
      else if (result === 'denied') toast.error('Notifications are blocked. Allow them in your browser settings.');
    } catch (error) {
      console.error('[ENABLE_NOTIFICATIONS]: ', error);
      toast.error('Failed to enable notifications.');
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 bg-[#1164A3] px-4 py-1.5 text-sm text-white">
      <BellRing className="size-4 shrink-0" />

      <span>Get notified about direct messages, thread replies and mentions.</span>

      <Button
        size="sm"
        variant="outline"
        className="h-7 border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
        disabled={isPending}
        onClick={onEnable}
      >
        Enable notifications
      </Button>

      <button type="button" onClick={onDismiss} className="ml-1 rounded p-1 hover:bg-white/10" aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </div>
  );
};
