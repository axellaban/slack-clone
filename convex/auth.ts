import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';

import { DataModel, Id } from './_generated/dataModel';
import { MutationCtx } from './_generated/server';

const DAY_MS = 1000 * 60 * 60 * 24;

type CreateOrUpdateUser = NonNullable<NonNullable<Parameters<typeof convexAuth>[0]['callbacks']>['createOrUpdateUser']>;

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
    };
  },
});

// Same as the library default (create the user, or link to an existing user with the same
// verified email), except that a returning user's name and photo are only taken from the
// provider until they edit their profile in the app.
export const createOrUpdateUser: CreateOrUpdateUser = async (genericCtx, args) => {
  const ctx = genericCtx as unknown as MutationCtx;
  const {
    provider,
    profile: { emailVerified: profileEmailVerified, phoneVerified: profilePhoneVerified, ...profile },
  } = args;

  const emailVerified =
    profileEmailVerified ??
    ((provider.type === 'oauth' || provider.type === 'oidc') && provider.allowDangerousEmailAccountLinking !== false);

  let userId = args.existingUserId as Id<'users'> | null;

  if (userId === null && typeof profile.email === 'string' && (args.shouldLink || emailVerified || provider.type === 'email')) {
    const email = profile.email;
    const usersWithEmail = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .filter((q) => q.neq(q.field('emailVerificationTime'), undefined))
      .take(2);

    if (usersWithEmail.length === 1) userId = usersWithEmail[0]._id;
  }

  const userData = {
    ...(emailVerified ? { emailVerificationTime: Date.now() } : null),
    ...(profilePhoneVerified ? { phoneVerificationTime: Date.now() } : null),
    ...profile,
  } as Partial<DataModel['users']['document']>;

  if (userId === null) return await ctx.db.insert('users', userData);

  const user = await ctx.db.get(userId);

  // photos uploaded in the app live in Convex storage; this also covers profiles edited
  // before profileUpdatedAt existed
  const hasUploadedPhoto = !!user?.image?.includes('/api/storage/');

  if (user?.profileUpdatedAt || hasUploadedPhoto) {
    delete userData.name;
    delete userData.image;
  }

  await ctx.db.patch(userId, userData);

  return userId;
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword, GitHub, Google],
  // stay signed in like Slack: sessions only end after 90 days without using the app
  session: {
    totalDurationMs: 365 * DAY_MS,
    inactiveDurationMs: 90 * DAY_MS,
  },
  callbacks: {
    createOrUpdateUser,
  },
});
