import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { type QueryCtx, mutation, query } from './_generated/server';

// counts above this are shown as "99+"
const MAX_COUNT = 100;

const getMember = async (ctx: QueryCtx, workspaceId: Id<'workspaces'>, userId: Id<'users'>) => {
  return await ctx.db
    .query('members')
    .withIndex('by_workspace_id_user_id', (q) => q.eq('workspaceId', workspaceId).eq('userId', userId))
    .unique();
};

export const markRead = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    channelId: v.optional(v.id('channels')),
    conversationId: v.optional(v.id('conversations')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Unauthorized.');

    const member = await getMember(ctx, args.workspaceId, userId);

    if (!member) throw new Error('Unauthorized.');

    if (!!args.channelId === !!args.conversationId) throw new Error('Provide either a channel or a conversation.');

    if (args.channelId) {
      const channel = await ctx.db.get(args.channelId);

      if (!channel || channel.workspaceId !== args.workspaceId) throw new Error('Channel not found.');
    }

    if (args.conversationId) {
      const conversation = await ctx.db.get(args.conversationId);

      if (!conversation || (conversation.memberOneId !== member._id && conversation.memberTwoId !== member._id))
        throw new Error('Conversation not found.');
    }

    const existing = args.channelId
      ? await ctx.db
          .query('reads')
          .withIndex('by_member_id_channel_id', (q) => q.eq('memberId', member._id).eq('channelId', args.channelId))
          .unique()
      : await ctx.db
          .query('reads')
          .withIndex('by_member_id_conversation_id', (q) => q.eq('memberId', member._id).eq('conversationId', args.conversationId))
          .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadAt: Date.now() });
    } else {
      await ctx.db.insert('reads', {
        memberId: member._id,
        workspaceId: args.workspaceId,
        channelId: args.channelId,
        conversationId: args.conversationId,
        lastReadAt: Date.now(),
      });
    }
  },
});

// unread top-level messages per channel and per direct message (keyed by the other member's id)
export const unreadCounts = query({
  args: {
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    const empty = { channels: {} as Record<string, number>, members: {} as Record<string, number> };

    const userId = await getAuthUserId(ctx);

    if (!userId) return empty;

    const member = await getMember(ctx, args.workspaceId, userId);

    if (!member) return empty;

    const reads = await ctx.db
      .query('reads')
      .withIndex('by_member_id', (q) => q.eq('memberId', member._id))
      .collect();

    // anything sent before joining the workspace is not unread
    const lastReadAt = (key: { channelId?: Id<'channels'>; conversationId?: Id<'conversations'> }) =>
      reads.find((read) => (key.channelId ? read.channelId === key.channelId : read.conversationId === key.conversationId))?.lastReadAt ??
      member._creationTime;

    const countUnread = async (channelId: Id<'channels'> | undefined, conversationId: Id<'conversations'> | undefined) => {
      const since = lastReadAt({ channelId, conversationId });

      const messages = await ctx.db
        .query('messages')
        .withIndex('by_channel_id_parent_message_id_conversation_id', (q) =>
          q.eq('channelId', channelId).eq('parentMessageId', undefined).eq('conversationId', conversationId).gt('_creationTime', since),
        )
        .take(MAX_COUNT);

      return messages.filter((message) => message.memberId !== member._id).length;
    };

    const channels = await ctx.db
      .query('channels')
      .withIndex('by_workspace_id', (q) => q.eq('workspaceId', args.workspaceId))
      .collect();

    const conversations = (
      await ctx.db
        .query('conversations')
        .withIndex('by_workspace_id', (q) => q.eq('workspaceId', args.workspaceId))
        .collect()
    ).filter((conversation) => conversation.memberOneId === member._id || conversation.memberTwoId === member._id);

    const result = { channels: {} as Record<string, number>, members: {} as Record<string, number> };

    await Promise.all([
      ...channels.map(async (channel) => {
        const count = await countUnread(channel._id, undefined);

        if (count) result.channels[channel._id] = count;
      }),
      ...conversations.map(async (conversation) => {
        const otherMemberId = conversation.memberOneId === member._id ? conversation.memberTwoId : conversation.memberOneId;
        const count = await countUnread(undefined, conversation._id);

        if (count) result.members[otherMemberId] = count;
      }),
    ]);

    return result;
  },
});
