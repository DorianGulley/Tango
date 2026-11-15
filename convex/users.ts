import { ConvexError, v } from 'convex/values';

import { mutation } from './_generated/server';
import { findUser } from './model';
import { ITEMS, type Answers } from './compatibility';
import { environment, gender, quizAnswers } from './schema';
import { ALLOWED_EMAIL_DOMAIN, isAllowedEmail, MAX_AGE, MIN_AGE, OPTIONAL_ITEMS } from './tangoConfig';


function validQuiz(quiz: Answers): Answers {
  const known = new Set(ITEMS.map((item) => item.id));
  if (Object.keys(quiz).some((id) => !known.has(id))) throw new ConvexError('Unknown question.');
  for (const item of ITEMS) {
    const answer = quiz[item.id];
    if (answer === undefined && OPTIONAL_ITEMS.includes(item.id)) continue;
    const valid =
      item.kind === 'scale'
        ? typeof answer === 'number' && Number.isInteger(answer) && answer >= item.min && answer <= item.max
        : typeof answer === 'string' && item.options.some((option) => option.value === answer);
    if (!valid) throw new ConvexError('Answer every question.');
  }
  return quiz;
}

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
    bio: v.optional(v.string()),
    quiz: quizAnswers,
    environments: v.array(environment),
  },
  handler: async (ctx, { deviceId, ...profile }) => {
    const name = profile.name.trim();
    const email = profile.email.trim().toLowerCase();
    if (!isAllowedEmail(email)) {
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
    const quiz = validQuiz(profile.quiz);
    if (profile.environments.length === 0) throw new ConvexError('Keep at least one place type.');
    const bio = profile.bio?.trim().slice(0, 280) || undefined;

    const existing = await findUser(ctx, deviceId);
    const doc = { ...profile, quiz, email, name, bio, deviceId };
    if (existing) {
      await ctx.db.replace('users', existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert('users', doc);
  },
});
