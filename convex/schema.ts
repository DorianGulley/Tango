import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const environment = v.union(
  v.literal('cafe'),
  v.literal('park'),
  v.literal('plaza'),
  v.literal('social'),
  v.literal('event'),
);
export const gender = v.union(v.literal('woman'), v.literal('man'), v.literal('nonbinary'));
export const intention = v.union(v.literal('serious'), v.literal('casual'), v.literal('open'));
export const matchStatus = v.union(
  v.literal('invited'),
  v.literal('planning'),
  v.literal('rendezvous'),
  v.literal('revealed'),
  v.literal('completed'),
  v.literal('closed'),
);
export const reportReason = v.union(
  v.literal('unsafe'),
  v.literal('inappropriate'),
  v.literal('no_show'),
  v.literal('other'),
);
export const feeling = v.union(
  v.literal('great'),
  v.literal('fine'),
  v.literal('awkward'),
  v.literal('uncomfortable'),
);

export default defineSchema({
  users: defineTable({
    deviceId: v.string(),
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
  }).index('by_deviceId', ['deviceId']),

  locations: defineTable({
    name: v.string(),
    type: environment,
    latitude: v.number(),
    longitude: v.number(),
    neighborhood: v.string(),
    description: v.string(),
    photoUrl: v.string(),
    photoCredit: v.string(),
    photoSource: v.string(),
  }).index('by_name', ['name']),

  sessions: defineTable({
    userId: v.id('users'),
    active: v.boolean(),
    expiresAt: v.number(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    matchId: v.optional(v.id('matches')),
  })
    .index('by_userId_and_active', ['userId', 'active'])
    .index('by_active', ['active']),

  matches: defineTable({
    userA: v.id('users'),
    userB: v.id('users'),
    locationId: v.id('locations'),
    score: v.number(),
    status: matchStatus,
    deadline: v.number(),
    acceptedA: v.boolean(),
    acceptedB: v.boolean(),
    confirmedA: v.boolean(),
    confirmedB: v.boolean(),
    arrivedA: v.boolean(),
    arrivedB: v.boolean(),
    doneA: v.boolean(),
    doneB: v.boolean(),
    dismissedA: v.boolean(),
    dismissedB: v.boolean(),
    colorIndex: v.number(),
    symbolIndex: v.number(),
    closedReason: v.optional(
      v.union(
        v.literal('declined'),
        v.literal('cancelled'),
        v.literal('expired'),
        v.literal('blocked'),
        v.literal('reported'),
      ),
    ),
  })
    .index('by_userA', ['userA'])
    .index('by_userB', ['userB']),

  pairs: defineTable({ key: v.string() }).index('by_key', ['key']),

  blocks: defineTable({
    blockerId: v.id('users'),
    blockedId: v.id('users'),
  }).index('by_blockerId_and_blockedId', ['blockerId', 'blockedId']),

  reports: defineTable({
    reporterId: v.id('users'),
    reportedId: v.id('users'),
    matchId: v.id('matches'),
    reason: reportReason,
    details: v.optional(v.string()),
  }),

  feedback: defineTable({
    matchId: v.id('matches'),
    userId: v.id('users'),
    met: v.boolean(),
    feeling,
    connectAgain: v.boolean(),
    contact: v.optional(v.string()),
    safetyNote: v.optional(v.string()),
  })
    .index('by_matchId_and_userId', ['matchId', 'userId'])
    .index('by_userId', ['userId']),
});
