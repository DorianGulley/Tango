import { query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query('locations').take(100);
    return locations.filter((l) => !l.retired).map(({ _id, name, type, neighborhood, description, photoUrl, photoCredit }) => ({
      _id,
      name,
      type,
      neighborhood,
      description,
      photoUrl,
      photoCredit,
    }));
  },
});
