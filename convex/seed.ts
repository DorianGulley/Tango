import { internalMutation } from './_generated/server';
import type { Environment } from './tangoConfig';

const LOCATIONS: {
  name: string;
  type: Environment;
  latitude: number;
  longitude: number;
  neighborhood: string;
  description: string;
  photoUrl: string;
  photoCredit: string;
  photoSource: string;
}[] = [
  {
    name: 'Coupa Café, Green Library',
    type: 'cafe',
    latitude: 37.4262,
    longitude: -122.16697,
    neighborhood: 'Main campus',
    description: 'A busy café on Escondido Mall beside Green Library, full of students between classes. Meet at the outdoor tables.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Stanford_University_Green_Library_Bing_Wing.jpg/1280px-Stanford_University_Green_Library_Bing_Wing.jpg',
    photoCredit: 'LPS.1, CC0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Stanford_University_Green_Library_Bing_Wing.jpg',
  },
  {
    name: 'CoHo',
    type: 'cafe',
    latitude: 37.42408,
    longitude: -122.17083,
    neighborhood: 'Tresidder',
    description: 'The Coffee House on the Tresidder patio, lively day and night. Meet by the patio entrance.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Tresidder_Union_Stanford_April_2013.jpg/1280px-Tresidder_Union_Stanford_April_2013.jpg',
    photoCredit: 'King of Hearts, CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Tresidder_Union_Stanford_April_2013.jpg',
  },
  {
    name: 'Main Quad',
    type: 'plaza',
    latitude: 37.42749,
    longitude: -122.17179,
    neighborhood: 'Main Quad',
    description: 'The sandstone arcades at the heart of campus. Meet at the main arch facing Palm Drive.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Stanford_University_Main_Quad_May_2011_001.jpg/1280px-Stanford_University_Main_Quad_May_2011_001.jpg',
    photoCredit: 'King of Hearts, CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Stanford_University_Main_Quad_May_2011_001.jpg',
  },
  {
    name: 'Memorial Church steps',
    type: 'plaza',
    latitude: 37.42692,
    longitude: -122.17051,
    neighborhood: 'Main Quad',
    description: 'The front steps of Memorial Church, facing the Inner Quad. Meet at the bottom of the steps.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Stanford_Memorial_Church_May_2011_001.jpg/1280px-Stanford_Memorial_Church_May_2011_001.jpg',
    photoCredit: 'King of Hearts, CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Stanford_Memorial_Church_May_2011_001.jpg',
  },
  {
    name: 'Old Union Courtyard',
    type: 'plaza',
    latitude: 37.42519,
    longitude: -122.17045,
    neighborhood: 'White Plaza',
    description: 'The courtyard and fountain beside White Plaza. Meet at the fountain.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Old_Union_Fountain.jpg/1280px-Old_Union_Fountain.jpg',
    photoCredit: 'John Loo, CC BY 2.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Old_Union_Fountain.jpg',
  },
  {
    name: 'The Oval',
    type: 'park',
    latitude: 37.43006,
    longitude: -122.16941,
    neighborhood: 'Palm Drive',
    description: 'The big lawn at the end of Palm Drive. Meet at the flower bed facing the Main Quad.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Stanford_Oval_May_2011_002.jpg/1280px-Stanford_Oval_May_2011_002.jpg',
    photoCredit: 'King of Hearts, CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Stanford_Oval_May_2011_002.jpg',
  },
  {
    name: 'Meyer Green',
    type: 'park',
    latitude: 37.42573,
    longitude: -122.16745,
    neighborhood: 'Main campus',
    description: 'An open lawn near Green Library that hosts concerts and study breaks. Meet at the path by the library.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Stanford_outdoor_concert.jpg/1280px-Stanford_outdoor_concert.jpg',
    photoCredit: 'Suiren2022, CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Stanford_outdoor_concert.jpg',
  },
  {
    name: 'Rodin Sculpture Garden',
    type: 'park',
    latitude: 37.43233,
    longitude: -122.171,
    neighborhood: 'Arts District',
    description: 'An open-air garden of Rodin bronzes beside the Cantor. Meet at The Gates of Hell.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Stanford_University%2C_Rodin_Sculpture_Garden%2C_May_28%2C_2023_-_77.jpg/1280px-Stanford_University%2C_Rodin_Sculpture_Garden%2C_May_28%2C_2023_-_77.jpg',
    photoCredit: '94rain, CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Stanford_University,_Rodin_Sculpture_Garden,_May_28,_2023_-_77.jpg',
  },
  {
    name: 'Cantor Arts Center',
    type: 'social',
    latitude: 37.43301,
    longitude: -122.17088,
    neighborhood: 'Arts District',
    description: "Stanford's free art museum. Meet in the main lobby.",
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Cantor_Arts_Center_sign.JPG/1280px-Cantor_Arts_Center_sign.JPG',
    photoCredit: 'BrokenSphere, CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Cantor_Arts_Center_sign.JPG',
  },
  {
    name: 'Bing Concert Hall',
    type: 'event',
    latitude: 37.432,
    longitude: -122.16612,
    neighborhood: 'Arts District',
    description: 'The campus concert hall and its plaza. Meet at the main entrance on Lasuen Street.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Bing_Concert_Hall_%288477427575%29.jpg/1280px-Bing_Concert_Hall_%288477427575%29.jpg',
    photoCredit: 'Akos Kokai, CC BY 2.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Bing_Concert_Hall_(8477427575).jpg',
  },
];

export const seedLocations = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (const location of LOCATIONS) {
      const existing = await ctx.db
        .query('locations')
        .withIndex('by_name', (q) => q.eq('name', location.name))
        .unique();
      if (existing) {
        await ctx.db.replace('locations', existing._id, location);
      } else {
        await ctx.db.insert('locations', location);
        inserted++;
      }
    }
    const names = new Set(LOCATIONS.map((l) => l.name));
    let retired = 0;
    for (const location of await ctx.db.query('locations').take(500)) {
      if (!names.has(location.name) && !location.retired) {
        await ctx.db.patch('locations', location._id, { retired: true });
        retired++;
      }
    }
    return { inserted, retired, total: LOCATIONS.length };
  },
});
