'use client';

import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/../convex/_generated/api';

type Permission = NotificationPermission | 'unsupported';

const isSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const getRegistration = () => navigator.serviceWorker.register('/sw.js');

// remembers that the user turned notifications off on this device
const DISABLED_KEY = 'push-notifications-disabled';

const setDisabled = (disabled: boolean) => {
  try {
    if (disabled) localStorage.setItem(DISABLED_KEY, 'true');
    else localStorage.removeItem(DISABLED_KEY);
  } catch {}
};

const isDisabled = () => {
  try {
    return localStorage.getItem(DISABLED_KEY) === 'true';
  } catch {
    return false;
  }
};

const toUint8Array = (base64Url: string) => {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');

  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

export const usePushNotifications = () => {
  const publicKey = useQuery(api.push.publicKey);
  const saveSubscription = useMutation(api.push.subscribe);
  const removeSubscription = useMutation(api.push.unsubscribe);

  const [permission, setPermission] = useState<Permission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // push only works once the server has VAPID keys
  const isAvailable = permission !== 'unsupported' && !!publicKey;

  const subscribe = useCallback(async () => {
    if (!publicKey) return;

    const registration = await getRegistration();
    await navigator.serviceWorker.ready;

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8Array(publicKey) }));

    const { endpoint, keys } = subscription.toJSON();

    if (!endpoint || !keys?.p256dh || !keys?.auth) throw new Error('Invalid push subscription.');

    await saveSubscription({ endpoint, p256dh: keys.p256dh, auth: keys.auth });
    setIsSubscribed(true);
  }, [publicKey, saveSubscription]);

  // keep this device's subscription linked to the signed-in user
  useEffect(() => {
    if (!isSupported()) return setPermission('unsupported');

    setPermission(Notification.permission);

    if (Notification.permission === 'granted' && publicKey && !isDisabled()) {
      subscribe().catch((error) => console.error('[PUSH_SUBSCRIBE]: ', error));
    }
  }, [publicKey, subscribe]);

  const enable = useCallback(async () => {
    setIsPending(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setDisabled(false);
        await subscribe();
      }

      return result;
    } finally {
      setIsPending(false);
    }
  }, [subscribe]);

  const disable = useCallback(async () => {
    setIsPending(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await removeSubscription({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }

      setDisabled(true);
      setIsSubscribed(false);
    } finally {
      setIsPending(false);
    }
  }, [removeSubscription]);

  return { isAvailable, permission, isSubscribed, isPending, enable, disable };
};
