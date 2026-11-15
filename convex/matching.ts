import { v } from 'convex/values';

import { internal } from './_generated/api';
import { compatibility, type Answers } from './compatibility';
import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, type MutationCtx } from './_generated/server';
import { closeMatch, distanceMeters, endSession, isBlocked, pairKey } from './model';
import { matchStatus } from './schema';
import {
  INVITE_MINUTES,
  MAX_TRAVEL_METERS,
  MAX_INVITE_STRENGTHS,
  MIN_MATCH_PERCENT,
  REVEAL_COLORS,
  REVEAL_SYMBOLS,
} from './tangoConfig';

function wantsEachOther(a: Doc<'users'>, b: Doc<'users'>) {
  return (
    a.interestedIn.includes(b.gender) &&
    b.interestedIn.includes(a.gender) &&
    b.age >= a.ageMin &&
    b.age <= a.ageMax &&
    a.age >= b.ageMin &&
    a.age <= b.ageMax
  );
}

type Positioned = Doc<'sessions'> & { latitude: number; longitude: number };

function isAvailable(session: Doc<'sessions'>, now: number): session is Positioned {
  return (
    session.active &&
    session.expiresAt > now &&
    session.matchId === undefined &&
    session.latitude !== undefined &&
    session.longitude !== undefined
  );
}

export async function findMatchFor(ctx: MutationCtx, sessionId: Id<'sessions'>) {
  const now = Date.now();
  const session = await ctx.db.get('sessions', sessionId);
  if (!session || !isAvailable(session, now)) return null;
  const me = await ctx.db.get('users', session.userId);
  if (!me?.quiz) return null;
  const myQuiz: Answers = me.quiz;

  const [candidates, locations] = await Promise.all([
    ctx.db
      .query('sessions')
      .withIndex('by_active', (q) => q.eq('active', true))
      .take(500),
    ctx.db.query('locations').take(500),
  ]);

  let best: {
    session: Positioned;
    location: Doc<'locations'>;
    score: number;
    strengths: string[];
    farther: number;
  } | null = null;

  for (const candidate of candidates) {
    if (candidate.userId === me._id || !isAvailable(candidate, now)) continue;
    const other = await ctx.db.get('users', candidate.userId);
    if (!other?.quiz || !wantsEachOther(me, other)) continue;
    const result = compatibility(myQuiz, other.quiz);
    if (!result.reliable || result.percent < MIN_MATCH_PERCENT) continue;
    const score = result.percent;
    if (best && score < best.score) continue;
    const pair = await ctx.db
      .query('pairs')
      .withIndex('by_key', (q) => q.eq('key', pairKey(me._id, other._id)))
      .first();
    if (pair || (await isBlocked(ctx, me._id, other._id))) continue;

    for (const location of locations) {
      if (location.retired) continue;
      if (!me.environments.includes(location.type) || !other.environments.includes(location.type)) {
        continue;
      }
      const farther = Math.max(
        distanceMeters(session, location),
        distanceMeters(candidate, location),
      );
      if (farther > MAX_TRAVEL_METERS) continue;
      if (!best || score > best.score || (score === best.score && farther < best.farther)) {
        best = { session: candidate, location, score, farther, strengths: result.strengths };
      }
    }
  }
  if (!best) return null;

  const deadline = now + INVITE_MINUTES * 60_000;
  const matchId = await ctx.db.insert('matches', {
    userA: me._id,
    userB: best.session.userId,
    locationId: best.location._id,
    score: best.score,
    strengths: best.strengths.slice(0, MAX_INVITE_STRENGTHS),
    status: 'invited',
    deadline,
    acceptedA: false,
    acceptedB: false,
    confirmedA: false,
    confirmedB: false,
    arrivedA: false,
    arrivedB: false,
    doneA: false,
    doneB: false,
    dismissedA: false,
    dismissedB: false,
    colorIndex: Math.floor(Math.random() * REVEAL_COLORS.length),
    symbolIndex: Math.floor(Math.random() * REVEAL_SYMBOLS.length),
  });
  await ctx.db.insert('pairs', { key: pairKey(me._id, best.session.userId) });
  await ctx.db.patch('sessions', session._id, { matchId });
  await ctx.db.patch('sessions', best.session._id, { matchId });
  await ctx.scheduler.runAt(deadline, internal.matching.expireMatch, {
    matchId,
    status: 'invited',
  });
  return matchId;
}

export const expireMatch = internalMutation({
  args: { matchId: v.id('matches'), status: matchStatus },
  handler: async (ctx, { matchId, status }) => {
    const match = await ctx.db.get('matches', matchId);
    if (!match || match.status !== status || match.deadline > Date.now()) return null;
    if (status === 'revealed') {
      await ctx.db.patch('matches', matchId, { status: 'completed' });
      return null;
    }
    await closeMatch(ctx, match, 'expired');
    return null;
  },
});

export const expireSession = internalMutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('sessions', sessionId);
    if (!session || !session.active || session.expiresAt > Date.now()) return null;
    if (session.matchId) {
      const match = await ctx.db.get('matches', session.matchId);
      if (match?.status === 'invited') await closeMatch(ctx, match, 'expired');
    }
    await endSession(ctx, session);
    return null;
  },
});

export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_active', (q) => q.eq('active', true))
      .take(500);
    for (const session of sessions) {
      if (session.expiresAt <= now) {
        await ctx.runMutation(internal.matching.expireSession, { sessionId: session._id });
      }
    }
    for (const session of sessions) {
      if (session.expiresAt > now) await findMatchFor(ctx, session._id);
    }
    return null;
  },
});
