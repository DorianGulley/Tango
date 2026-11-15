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
    name: 'Caffe Trieste',
    type: 'cafe',
    latitude: 37.79868,
    longitude: -122.40752,
    neighborhood: 'North Beach',
    description: 'The West Coast\'s first espresso house, busy from morning to night. Meet by the front counter.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Caffe_Trieste_-_2016-10_-_01.jpg/1280px-Caffe_Trieste_-_2016-10_-_01.jpg',
    photoCredit: 'Nicolas Vigier, CC0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Caffe_Trieste_-_2016-10_-_01.jpg',
  },
  {
    name: 'Blue Bottle Coffee, Mint Plaza',
    type: 'cafe',
    latitude: 37.78252,
    longitude: -122.40727,
    neighborhood: 'SoMa',
    description: 'A bright café opening onto a pedestrian plaza off Fifth Street. Meet at the plaza-side door.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Blue_Bottle_Mint_Plaza_%2814948139031%29.jpg/1280px-Blue_Bottle_Mint_Plaza_%2814948139031%29.jpg',
    photoCredit: 'Christopher Michel, CC BY 2.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Blue_Bottle_Mint_Plaza_(14948139031).jpg',
  },
  {
    name: 'Sightglass Coffee',
    type: 'cafe',
    latitude: 37.77693,
    longitude: -122.40846,
    neighborhood: 'SoMa',
    description: 'A roomy roastery café on Seventh Street with a long coffee bar. Meet at the bar.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Cappuccino_at_Sightglass_Coffee.jpg/1280px-Cappuccino_at_Sightglass_Coffee.jpg',
    photoCredit: 'Jonathan McIntosh, CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Cappuccino_at_Sightglass_Coffee.jpg',
  },
  {
    name: 'Philz Coffee, 24th & Folsom',
    type: 'cafe',
    latitude: 37.75264,
    longitude: -122.41428,
    neighborhood: 'Mission',
    description: 'The original Philz, a neighborhood favorite that is always lively. Meet at the order counter.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Philz_Coffee_-_24th-Folsom_-_SF%2C_CA.jpg',
    photoCredit: 'Eric Heath, CC BY 2.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Philz_Coffee_-_24th-Folsom_-_SF,_CA.jpg',
  },
  {
    name: 'Mission Dolores Park',
    type: 'park',
    latitude: 37.75965,
    longitude: -122.42695,
    neighborhood: 'Mission',
    description: 'The city\'s sunny living room. Meet at the Mexican Liberty Bell near 19th and Dolores.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/View_from_top_of_Mission_Dolores_Park%2C_SF_%28July_2017%29.jpg/1280px-View_from_top_of_Mission_Dolores_Park%2C_SF_%28July_2017%29.jpg',
    photoCredit: 'Mélanie Lacroix, CC0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:View_from_top_of_Mission_Dolores_Park,_SF_(July_2017).jpg',
  },
  {
    name: 'Washington Square',
    type: 'park',
    latitude: 37.80076,
    longitude: -122.41004,
    neighborhood: 'North Beach',
    description: 'A lawn in front of Saints Peter and Paul Church, ringed by cafés. Meet at the Benjamin Franklin statue.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/2011-08-14_San_Francisco_120_Washington_Square.jpg/1280px-2011-08-14_San_Francisco_120_Washington_Square.jpg',
    photoCredit: 'Allie Caulfield, CC BY 2.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:2011-08-14_San_Francisco_120_Washington_Square.jpg',
  },
  {
    name: 'Yerba Buena Gardens',
    type: 'park',
    latitude: 37.78497,
    longitude: -122.40246,
    neighborhood: 'SoMa',
    description: 'A downtown garden between museums and the Moscone Center. Meet at the top of the waterfall.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/San_Francisco_Yerba_Buena_Gardens_004.jpg/1280px-San_Francisco_Yerba_Buena_Gardens_004.jpg',
    photoCredit: 'Sebastian Wallroth, public domain',
    photoSource: 'https://commons.wikimedia.org/wiki/File:San_Francisco_Yerba_Buena_Gardens_004.jpg',
  },
  {
    name: 'Union Square',
    type: 'plaza',
    latitude: 37.78797,
    longitude: -122.4075,
    neighborhood: 'Union Square',
    description: 'The busy heart of downtown shopping. Meet at the base of the Dewey Monument in the center.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/San_Francisco_%28CA%2C_USA%29%2C_Union_Square%2C_Dewey_Monument_--_2022_--_2915.jpg/1280px-San_Francisco_%28CA%2C_USA%29%2C_Union_Square%2C_Dewey_Monument_--_2022_--_2915.jpg',
    photoCredit: 'Dietmar Rabich, CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:San_Francisco_(CA,_USA),_Union_Square,_Dewey_Monument_--_2022_--_2915.jpg',
  },
  {
    name: 'Embarcadero Plaza',
    type: 'plaza',
    latitude: 37.795,
    longitude: -122.39646,
    neighborhood: 'Embarcadero',
    description: 'A wide waterfront plaza across from the Ferry Building. Meet by the Vaillancourt Fountain.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Embarcadero_Plaza_in_San_Francisco.jpg/1280px-Embarcadero_Plaza_in_San_Francisco.jpg',
    photoCredit: 'Kylelovesyou, CC0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Embarcadero_Plaza_in_San_Francisco.jpg',
  },
  {
    name: "Patricia's Green",
    type: 'plaza',
    latitude: 37.77641,
    longitude: -122.42438,
    neighborhood: 'Hayes Valley',
    description: 'A small green on Octavia Boulevard surrounded by shops and cafés. Meet by the central sculpture.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Koilos_on_Patricia%27s_Green.jpg/1280px-Koilos_on_Patricia%27s_Green.jpg',
    photoCredit: 'Jarek Piórkowski, CC BY-SA 4.0',
    photoSource: "https://commons.wikimedia.org/wiki/File:Koilos_on_Patricia's_Green.jpg",
  },
  {
    name: 'Ferry Building Marketplace',
    type: 'social',
    latitude: 37.79554,
    longitude: -122.39369,
    neighborhood: 'Embarcadero',
    description: 'A food hall in the historic ferry terminal. Meet under the clock tower in the main nave.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/San_Francisco_Ferry_Building_%28cropped%29.jpg/1280px-San_Francisco_Ferry_Building_%28cropped%29.jpg',
    photoCredit: 'JaGa, CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:San_Francisco_Ferry_Building_(cropped).jpg',
  },
  {
    name: 'SFMOMA',
    type: 'social',
    latitude: 37.78573,
    longitude: -122.40108,
    neighborhood: 'SoMa',
    description: 'The modern art museum\'s free ground-floor galleries and lobby. Meet in the Third Street lobby.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/San_Francisco_Museum_of_Modern_Art-.jpg/1280px-San_Francisco_Museum_of_Modern_Art-.jpg',
    photoCredit: 'Yair Haklai, CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:San_Francisco_Museum_of_Modern_Art-.jpg',
  },
  {
    name: 'Fort Mason Center',
    type: 'event',
    latitude: 37.8058,
    longitude: -122.43173,
    neighborhood: 'Marina',
    description: 'Waterfront piers that host Off the Grid, markets, and shows. Meet at the main gate on Marina Boulevard.',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/San_Francisco_Fort_Mason_Center_-_April_2018_%287692%29.jpg/1280px-San_Francisco_Fort_Mason_Center_-_April_2018_%287692%29.jpg',
    photoCredit: 'Gregory Varnum, CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:San_Francisco_Fort_Mason_Center_-_April_2018_(7692).jpg',
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
    return { inserted, total: LOCATIONS.length };
  },
});
