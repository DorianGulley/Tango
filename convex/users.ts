import { ConvexError, v } from 'convex/values';

import { mutation } from './_generated/server';
import { findUser } from './model';
import { environment, gender, intention } from './schema';
import { ALLOWED_EMAIL_DOMAIN, MAX_AGE, MIN_AGE, QUESTIONS } from './tangoConfig';

const ALLOWED_EMAIL = new RegExp(`^[^\\s@]+@([a-z0-9-]+\\.)*${ALLOWED_EMAIL_DOMAIN.replaceAll('.', '\\.')}$`);

export const saveProfile = mutation({
  args: {
    deviceId: v.string(),
    email: v.string(),
    name: v.string(),
    age: v.number(),
    gender,
    interestedIn: v.array(gender),
    ageMin: v.number(),
    ageMax: v.number(),
    intention,
    bio: v.optional(v.string()),
    answers: v.array(v.number()),
    environments: v.array(environment),
  },
  handler: async (ctx, { deviceId, ...profile }) => {
    const name = profile.name.trim();
    const email = profile.email.trim().toLowerCase();
    if (!ALLOWED_EMAIL.test(email)) {
      throw new ConvexError(`Use your @${ALLOWED_EMAIL_DOMAIN} email address.`);
    }
    if (deviceId.length < 32) throw new ConvexError('Invalid device.');
    if (!name || name.length > 40) throw new ConvexError('Add a first name (up to 40 characters).');
    if (!Number.isInteger(profile.age) || profile.age < MIN_AGE || profile.age > MAX_AGE) {
      throw new ConvexError(`Tango is for people ${MIN_AGE} and over.`);
    }
    if (
      profile.ageMin < MIN_AGE ||
      profile.ageMax > MAX_AGE ||
      profile.ageMin > profile.ageMax
    ) {
      throw new ConvexError(`Pick an age range between ${MIN_AGE} and ${MAX_AGE}.`);
    }
    if (profile.interestedIn.length === 0) throw new ConvexError('Pick who you want to meet.');
    if (
      profile.answers.length !== QUESTIONS.length ||
      profile.answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= QUESTIONS[i].options.length)
    ) {
      throw new ConvexError('Answer every question.');
    }
    if (profile.environments.length === 0) throw new ConvexError('Keep at least one place type.');
    const bio = profile.bio?.trim().slice(0, 280) || undefined;

    const existing = await findUser(ctx, deviceId);
    const emailOwner = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();
    if (emailOwner && emailOwner._id !== existing?._id) {
      throw new ConvexError('That email already has a Tango account.');
    }
    const doc = { ...profile, email, name, bio, deviceId };
    if (existing) {
      await ctx.db.replace('users', existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert('users', doc);
  },
});
