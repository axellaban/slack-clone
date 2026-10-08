import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) return null;

    return await ctx.db.get(userId);
  },
});

export const update = mutation({
  args: {
    name: v.string(),
    image: v.optional(v.id('_storage')),
    removeImage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Unauthorized.');

    const name = args.name.trim();

    if (name.length < 1 || name.length > 80) throw new Error('Name must be between 1 and 80 characters.');

    const patch: { name: string; image?: string; profileUpdatedAt: number } = { name, profileUpdatedAt: Date.now() };

    if (args.image) {
      const url = await ctx.storage.getUrl(args.image);

      if (!url) throw new Error('Image not found.');

      patch.image = url;
    } else if (args.removeImage) {
      patch.image = undefined;
    }

    await ctx.db.patch(userId, patch);

    return userId;
  },
});
