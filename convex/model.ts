import { ConvexError } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

export type Side = 'A' | 'B';

export async function findUser(ctx: QueryCtx, deviceId: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_deviceId', (q) => q.eq('deviceId', deviceId))
    .unique();
}

export async function requireUser(ctx: QueryCtx, deviceId: string) {
  const user = await findUser(ctx, deviceId);
  if (!user) throw new ConvexError('Finish your profile first.');
  return user;
}

export async function activeSession(ctx: QueryCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('sessions')
    .withIndex('by_userId_and_active', (q) => q.eq('userId', userId).eq('active', true))
    .first();
}

export async function latestMatch(ctx: QueryCtx, userId: Id<'users'>) {
  const [asA, asB] = await Promise.all([
    ctx.db.query('matches').withIndex('by_userA', (q) => q.eq('userA', userId)).order('desc').first(),
    ctx.db.query('matches').withIndex('by_userB', (q) => q.eq('userB', userId)).order('desc').first(),
  ]);
  if (!asA) return asB;
  if (!asB) return asA;
  return asA._creationTime > asB._creationTime ? asA : asB;
}

export async function requireMatch(ctx: QueryCtx, userId: Id<'users'>, matchId: Id<'matches'>) {
  const match = await ctx.db.get('matches', matchId);
  if (!match || (match.userA !== userId && match.userB !== userId)) {
    throw new ConvexError('This Tango is no longer available.');
  }
  const side: Side = match.userA === userId ? 'A' : 'B';
  const otherId = side === 'A' ? match.userB : match.userA;
  return { match, side, otherId };
}

export function mine(match: Doc<'matches'>, field: Flag, side: Side): boolean {
  return match[`${field}${side}`];
}

type Flag = 'accepted' | 'confirmed' | 'arrived' | 'done' | 'dismissed';

export function flag(field: Flag, side: Side) {
  return { [`${field}${side}`]: true } as Partial<Doc<'matches'>>;
}

export function pairKey(a: Id<'users'>, b: Id<'users'>) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export async function endSession(ctx: MutationCtx, session: Doc<'sessions'>) {
  await ctx.db.patch('sessions', session._id, {
    active: false,
    latitude: undefined,
    longitude: undefined,
    matchId: undefined,
  });
}

export async function releaseSessions(ctx: MutationCtx, match: Doc<'matches'>) {
  for (const userId of [match.userA, match.userB]) {
    const session = await activeSession(ctx, userId);
    if (session && session.matchId === match._id) {
      await ctx.db.patch('sessions', session._id, { matchId: undefined });
    }
  }
}

export async function closeMatch(
  ctx: MutationCtx,
  match: Doc<'matches'>,
  reason: NonNullable<Doc<'matches'>['closedReason']>,
) {
  if (match.status === 'closed' || match.status === 'completed') return;
  await ctx.db.patch('matches', match._id, { status: 'closed', closedReason: reason });
  await releaseSessions(ctx, match);
}
