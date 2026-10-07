'use node';

import { v } from 'convex/values';
import webpush from 'web-push';

import { internal } from './_generated/api';
import { internalAction } from './_generated/server';

export const sendMessageNotifications = internalAction({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    // push is optional: skip silently until VAPID keys are configured
    if (!publicKey || !privateKey) return;

    const siteUrl = process.env.SITE_URL;
    const subject = process.env.VAPID_SUBJECT ?? (siteUrl?.startsWith('https://') ? siteUrl : 'mailto:notifications@example.com');

    const notifications = await ctx.runQuery(internal.push.getMessageNotifications, { messageId: args.messageId });

    await Promise.all(
      notifications.map(async ({ endpoint, keys, payload }) => {
        try {
          await webpush.sendNotification({ endpoint, keys }, JSON.stringify(payload), {
            vapidDetails: { subject, publicKey, privateKey },
            TTL: 60 * 60,
            urgency: 'high',
          });
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;

          // the browser revoked or expired the subscription
          if (statusCode === 404 || statusCode === 410) {
            await ctx.runMutation(internal.push.removeSubscription, { endpoint });
          } else {
            console.error('[PUSH]: ', statusCode, (error as Error).message);
          }
        }
      }),
    );
  },
});
