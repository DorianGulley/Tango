import { ConvexError, v } from 'convex/values';

import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { findMatchFor } from './matching';
import {
  activeSession,
  closeMatch,
  distanceMeters,
  endSession,
  findUser,
  latestMatch,
  mutualInterest,
  flag,
  mine,
  requireMatch,
  requireUser,
  type Side,
} from './model';
import { feeling, reportReason } from './schema';
import {
  CAMPUS_CENTER,
  CAMPUS_NAME,
  CAMPUS_RADIUS_METERS,
  COARSE_POSITION_DECIMALS,
  PLAN_CONFIRM_MINUTES,
  RENDEZVOUS_MINUTES,
  REVEAL_COLORS,
  REVEAL_SYMBOLS,
  SESSION_MINUTES,
} from './tangoConfig';

const OPEN_STATUSES = new Set(['invited', 'planning', 'rendezvous', 'revealed']);

export const state = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await findUser(ctx, deviceId);
    if (!user) return null;
    const session = await activeSession(ctx, user._id);
    const match = await latestMatch(ctx, user._id);

    const profile = {
      email: user.email ?? null,
      name: user.name,
      age: user.age,
      gender: user.gender,
      interestedIn: user.interestedIn,
      ageMin: user.ageMin,
      ageMax: user.ageMax,
      intention: user.intention,
      bio: user.bio ?? null,
      answers: user.answers,
      environments: user.environments,
    };
    const tangoMode = session ? { expiresAt: session.expiresAt } : null;

    const connections = [];
    const interested = await ctx.db
      .query('feedback')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50);
    for (const own of interested) {
      if (!own.connectAgain) continue;
      const past = await ctx.db.get('matches', own.matchId);
      if (!past) continue;
      const interest = await mutualInterest(ctx, past, user._id);
      if (!interest.mutual) continue;
      const place = await ctx.db.get('locations', past.locationId);
      connections.push({
        matchId: past._id,
        placeName: place?.name ?? 'your Tango',
        metOn: past._creationTime,
        theirContact: interest.theirContact,
      });
    }

    if (!match) return { profile, tangoMode, connections, match: null };
    const side: Side = match.userA === user._id ? 'A' : 'B';
    if (mine(match, 'dismissed', side)) return { profile, tangoMode, connections, match: null };

    const showPlace = match.status !== 'invited' && match.status !== 'closed';
    const location = showPlace ? await ctx.db.get('locations', match.locationId) : null;

    const feedback =
      match.status === 'completed' || match.status === 'revealed'
        ? await mutualInterest(ctx, match, user._id)
        : null;

    return {
      profile,
      tangoMode,
      connections,
      match: {
        id: match._id,
        status: match.status,
        deadline: match.deadline,
        accepted: mine(match, 'accepted', side),
        confirmed: mine(match, 'confirmed', side),
        arrived: mine(match, 'arrived', side),
        done: mine(match, 'done', side),
        place: location && {
          name: location.name,
          type: location.type,
          neighborhood: location.neighborhood,
          description: location.description,
          latitude: location.latitude,
          longitude: location.longitude,
          photoUrl: location.photoUrl,
          photoCredit: location.photoCredit,
        },
        reveal:
          match.status === 'revealed' || match.status === 'completed'
            ? { color: REVEAL_COLORS[match.colorIndex], symbol: REVEAL_SYMBOLS[match.symbolIndex] }
            : null,
        feedback,
      },
    };
  },
});

function coarse(value: number) {
  const factor = 10 ** COARSE_POSITION_DECIMALS;
  return Math.round(value * factor) / factor;
}

export const setTangoMode = mutation({
  args: {
    deviceId: v.string(),
    on: v.boolean(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, on, latitude, longitude }) => {
    const user = await requireUser(ctx, deviceId);
    const session = await activeSession(ctx, user._id);

    if (!on) {
      if (!session) return null;
      if (session.matchId) {
        const match = await ctx.db.get('matches', session.matchId);
        if (match) await closeMatch(ctx, match, 'cancelled');
      }
      await endSession(ctx, session);
      return null;
    }

    if (latitude === undefined || longitude === undefined) {
      throw new ConvexError('Tango Mode needs your location.');
    }
    if (!user.email) throw new ConvexError('Add your school email to your profile first.');
    if (distanceMeters({ latitude, longitude }, CAMPUS_CENTER) > CAMPUS_RADIUS_METERS) {
      throw new ConvexError(`Tango only works on the ${CAMPUS_NAME} campus for now.`);
    }
    const current = await latestMatch(ctx, user._id);
    const side: Side = current?.userA === user._id ? 'A' : 'B';
    if (current && OPEN_STATUSES.has(current.status) && !mine(current, 'dismissed', side)) {
      throw new ConvexError('Finish or cancel your current Tango first.');
    }
    const position = { latitude: coarse(latitude), longitude: coarse(longitude) };
    if (session) {
      await ctx.db.patch('sessions', session._id, position);
      await findMatchFor(ctx, session._id);
      return null;
    }
    const expiresAt = Date.now() + SESSION_MINUTES * 60_000;
    const sessionId = await ctx.db.insert('sessions', {
      userId: user._id,
      active: true,
      expiresAt,
      ...position,
    });
    await ctx.scheduler.runAt(expiresAt, internal.matching.expireSession, { sessionId });
    await findMatchFor(ctx, sessionId);
    return null;
  },
});

async function loadOpenMatch(
  ctx: MutationCtx,
  deviceId: string,
  matchId: Doc<'matches'>['_id'],
  status: Doc<'matches'>['status'],
) {
  const user = await requireUser(ctx, deviceId);
  const loaded = await requireMatch(ctx, user._id, matchId);
  if (loaded.match.status !== status || loaded.match.deadline <= Date.now()) {
    throw new ConvexError('This step has already passed.');
  }
  return { user, ...loaded };
}

async function scheduleDeadline(
  ctx: MutationCtx,
  match: Doc<'matches'>,
  status: Doc<'matches'>['status'],
  deadline: number,
) {
  await ctx.db.patch('matches', match._id, { status, deadline });
  await ctx.scheduler.runAt(deadline, internal.matching.expireMatch, { matchId: match._id, status });
}

export const respondInvite = mutation({
  args: { deviceId: v.string(), matchId: v.id('matches'), accept: v.boolean() },
  handler: async (ctx, { deviceId, matchId, accept }) => {
    const { match, side } = await loadOpenMatch(ctx, deviceId, matchId, 'invited');
    if (!accept) {
      await closeMatch(ctx, match, 'declined');
      return null;
    }
    await ctx.db.patch('matches', matchId, flag('accepted', side));
    const otherAccepted = side === 'A' ? match.acceptedB : match.acceptedA;
    if (!otherAccepted) return null;

    for (const userId of [match.userA, match.userB]) {
      const session = await activeSession(ctx, userId);
      if (session) await endSession(ctx, session);
    }
    await scheduleDeadline(ctx, match, 'planning', Date.now() + PLAN_CONFIRM_MINUTES * 60_000);
    return null;
  },
});

export const confirmPlan = mutation({
  args: { deviceId: v.string(), matchId: v.id('matches') },
  handler: async (ctx, { deviceId, matchId }) => {
    const { match, side } = await loadOpenMatch(ctx, deviceId, matchId, 'planning');
    await ctx.db.patch('matches', matchId, flag('confirmed', side));
    const otherConfirmed = side === 'A' ? match.confirmedB : match.confirmedA;
    if (otherConfirmed) {
      await scheduleDeadline(ctx, match, 'rendezvous', Date.now() + RENDEZVOUS_MINUTES * 60_000);
    }
    return null;
  },
});

export const arrive = mutation({
  args: { deviceId: v.string(), matchId: v.id('matches') },
  handler: async (ctx, { deviceId, matchId }) => {
    const { match, side } = await loadOpenMatch(ctx, deviceId, matchId, 'rendezvous');
    await ctx.db.patch('matches', matchId, flag('arrived', side));
    const otherArrived = side === 'A' ? match.arrivedB : match.arrivedA;
    if (otherArrived) await scheduleDeadline(ctx, match, 'revealed', match.deadline);
    return null;
  },
});

export const finish = mutation({
  args: { deviceId: v.string(), matchId: v.id('matches') },
  handler: async (ctx, { deviceId, matchId }) => {
    const { match, side } = await loadOpenMatch(ctx, deviceId, matchId, 'revealed');
    const otherDone = side === 'A' ? match.doneB : match.doneA;
    await ctx.db.patch('matches', matchId, {
      ...flag('done', side),
      ...(otherDone ? { status: 'completed' as const } : {}),
    });
    return null;
  },
});

export const cancel = mutation({
  args: { deviceId: v.string(), matchId: v.id('matches') },
  handler: async (ctx, { deviceId, matchId }) => {
    const user = await requireUser(ctx, deviceId);
    const { match } = await requireMatch(ctx, user._id, matchId);
    await closeMatch(ctx, match, 'cancelled');
    return null;
  },
});

async function blockOther(ctx: MutationCtx, deviceId: string, matchId: Doc<'matches'>['_id']) {
  const user = await requireUser(ctx, deviceId);
  const { match, otherId } = await requireMatch(ctx, user._id, matchId);
  const existing = await ctx.db
    .query('blocks')
    .withIndex('by_blockerId_and_blockedId', (q) => q.eq('blockerId', user._id).eq('blockedId', otherId))
    .first();
  if (!existing) await ctx.db.insert('blocks', { blockerId: user._id, blockedId: otherId });
  return { user, match, otherId };
}

export const block = mutation({
  args: { deviceId: v.string(), matchId: v.id('matches') },
  handler: async (ctx, { deviceId, matchId }) => {
    const { match } = await blockOther(ctx, deviceId, matchId);
    await closeMatch(ctx, match, 'blocked');
    return null;
  },
});

export const report = mutation({
  args: {
    deviceId: v.string(),
    matchId: v.id('matches'),
    reason: reportReason,
    details: v.optional(v.string()),
  },
  handler: async (ctx, { deviceId, matchId, reason, details }) => {
    const { user, match, otherId } = await blockOther(ctx, deviceId, matchId);
    await ctx.db.insert('reports', {
      reporterId: user._id,
      reportedId: otherId,
      matchId,
      reason,
      details: details?.trim().slice(0, 1000) || undefined,
    });
    await closeMatch(ctx, match, 'reported');
    return null;
  },
});

export const dismiss = mutation({
  args: { deviceId: v.string(), matchId: v.id('matches') },
  handler: async (ctx, { deviceId, matchId }) => {
    const user = await requireUser(ctx, deviceId);
    const { match, side } = await requireMatch(ctx, user._id, matchId);
    if (OPEN_STATUSES.has(match.status) && !(match.status === 'revealed' && mine(match, 'done', side))) {
      throw new ConvexError('Cancel this Tango instead.');
    }
    await ctx.db.patch('matches', matchId, flag('dismissed', side));
    return null;
  },
});

export const submitFeedback = mutation({
  args: {
    deviceId: v.string(),
    matchId: v.id('matches'),
    met: v.boolean(),
    feeling,
    connectAgain: v.boolean(),
    contact: v.optional(v.string()),
    safetyNote: v.optional(v.string()),
  },
  handler: async (ctx, { deviceId, matchId, ...answers }) => {
    const user = await requireUser(ctx, deviceId);
    const { match } = await requireMatch(ctx, user._id, matchId);
    if (match.status !== 'revealed' && match.status !== 'completed') {
      throw new ConvexError('The check-in opens after your Tango.');
    }
    const existing = await ctx.db
      .query('feedback')
      .withIndex('by_matchId_and_userId', (q) => q.eq('matchId', matchId).eq('userId', user._id))
      .unique();
    if (existing) throw new ConvexError('You already checked in.');
    await ctx.db.insert('feedback', {
      matchId,
      userId: user._id,
      met: answers.met,
      feeling: answers.feeling,
      connectAgain: answers.connectAgain,
      contact: (answers.connectAgain && answers.contact?.trim().slice(0, 120)) || undefined,
      safetyNote: answers.safetyNote?.trim().slice(0, 1000) || undefined,
    });
    return null;
  },
});
