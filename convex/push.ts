import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { describeMessage } from './utils';

const MAX_BODY_LENGTH = 140;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const publicKey = query({
  args: {},
  handler: async () => {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  },
});

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Unauthorized.');

    const existing = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .unique();

    // a browser can switch accounts, so the endpoint always belongs to the latest user
    if (existing) {
      await ctx.db.patch(existing._id, { userId, p256dh: args.p256dh, auth: args.auth });
    } else {
      await ctx.db.insert('pushSubscriptions', { userId, ...args });
    }
  },
});

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Unauthorized.');

    const existing = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .unique();

    if (existing && existing.userId === userId) await ctx.db.delete(existing._id);
  },
});

export const removeSubscription = internalMutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .unique();

    if (existing) await ctx.db.delete(existing._id);
  },
});

// Who to notify for a new message, Slack style: the other side of a DM, everyone in a thread,
// and members mentioned with @Name (or everyone with @channel / @here / @everyone).
export const getMessageNotifications = internalQuery({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) return [];

    const sender = await ctx.db.get(message.memberId);
    const senderUser = sender ? await ctx.db.get(sender.userId) : null;

    if (!sender || !senderUser) return [];

    const senderName = senderUser.name ?? 'Someone';
    const text = describeMessage(message);
    const recipients = new Set<Id<'members'>>();

    const parent = message.parentMessageId ? await ctx.db.get(message.parentMessageId) : null;
    const channelId = message.channelId ?? parent?.channelId;
    const conversationId = message.conversationId ?? parent?.conversationId;
    const channel = channelId ? await ctx.db.get(channelId) : null;

    let title = senderName;
    let path: string;

    if (conversationId) {
      const conversation = await ctx.db.get(conversationId);

      if (!conversation) return [];

      recipients.add(conversation.memberOneId === sender._id ? conversation.memberTwoId : conversation.memberOneId);
      path = `member/${sender._id}`;
    } else if (channel) {
      title = `${senderName} in #${channel.name}`;
      path = `channel/${channel._id}`;
    } else {
      return [];
    }

    if (parent) {
      recipients.add(parent.memberId);

      const replies = await ctx.db
        .query('messages')
        .withIndex('by_parent_message_id', (q) => q.eq('parentMessageId', parent._id))
        .collect();

      replies.forEach((reply) => recipients.add(reply.memberId));

      title = channel ? `${senderName} replied in #${channel.name}` : `${senderName} replied to a thread`;
      path += `?parentMessageId=${parent._id}`;
    }

    if (channel) {
      const members = await ctx.db
        .query('members')
        .withIndex('by_workspace_id', (q) => q.eq('workspaceId', message.workspaceId))
        .collect();

      const lowerText = text.toLowerCase();
      const mentionsEveryone = !parent && /(^|\s)@(channel|here|everyone)\b/.test(lowerText);

      for (const member of members) {
        const user = await ctx.db.get(member.userId);

        const name = user?.name?.toLowerCase();
        const isMentioned =
          !!name && (lowerText.includes(`@${name}`) || new RegExp(`(^|\\s)@${escapeRegExp(name.split(' ')[0])}\\b`).test(lowerText));

        if (mentionsEveryone || isMentioned) recipients.add(member._id);
      }
    }

    recipients.delete(sender._id);

    const payload = {
      title,
      body: text.length > MAX_BODY_LENGTH ? `${text.slice(0, MAX_BODY_LENGTH - 1)}…` : text,
      icon: senderUser.image,
      url: `/workspace/${message.workspaceId}/${path}`,
      tag: conversationId ?? channelId,
    };

    const notifications = await Promise.all(
      [...recipients].map(async (memberId) => {
        const member = await ctx.db.get(memberId);

        if (!member) return [];

        const subscriptions = await ctx.db
          .query('pushSubscriptions')
          .withIndex('by_user_id', (q) => q.eq('userId', member.userId))
          .collect();

        return subscriptions.map(({ endpoint, p256dh, auth }) => ({ endpoint, keys: { p256dh, auth }, payload }));
      }),
    );

    return notifications.flat();
  },
});
