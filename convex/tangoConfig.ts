// Product decisions for the Tango MVP. The concept doc left these TBD; change them here.

export const SESSION_MINUTES = 60;
export const INVITE_MINUTES = 5;
export const PLAN_CONFIRM_MINUTES = 10;
export const RENDEZVOUS_MINUTES = 30;

export const MAX_TRAVEL_METERS = 241;
export const MIN_COMPATIBILITY = 0.5;
export const COARSE_POSITION_DECIMALS = 3;
export const MIN_AGE = 18;
export const MAX_AGE = 99;

export const ENVIRONMENTS = [
  { id: 'cafe', label: 'Cafés', symbol: 'cup.and.saucer.fill' },
  { id: 'park', label: 'Lawns & gardens', symbol: 'tree.fill' },
  { id: 'plaza', label: 'Public plazas', symbol: 'building.columns.fill' },
  { id: 'social', label: 'Social venues', symbol: 'person.3.fill' },
  { id: 'event', label: 'Events', symbol: 'ticket.fill' },
] as const;
export type Environment = (typeof ENVIRONMENTS)[number]['id'];
export const ENVIRONMENT_IDS = ENVIRONMENTS.map((e) => e.id) as Environment[];

export const GENDERS = [
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'nonbinary', label: 'Non-binary' },
] as const;
export type Gender = (typeof GENDERS)[number]['id'];

export const INTENTIONS = [
  { id: 'serious', label: 'Something serious' },
  { id: 'casual', label: 'Something casual' },
  { id: 'open', label: 'Open to see' },
] as const;
export type Intention = (typeof INTENTIONS)[number]['id'];

export const QUESTIONS = [
  {
    prompt: 'Your ideal Saturday morning?',
    options: ['Farmers market', 'Long run or hike', 'Sleeping in', 'Brunch with friends'],
  },
  {
    prompt: 'At a party, you are usually…',
    options: ['Meeting everyone', 'Deep in one conversation', 'In the kitchen', 'Leaving early'],
  },
  {
    prompt: 'Pick a weekend trip',
    options: ['Big Sur camping', 'Napa wine tasting', 'Tahoe skiing', 'Staying in the city'],
  },
  {
    prompt: 'How do you recharge?',
    options: ['Alone time', 'Friends', 'Getting outside', 'Making something'],
  },
  {
    prompt: 'Plans or spontaneity?',
    options: ['Plan everything', 'Mostly plans', 'Mostly spontaneous', 'Pure spontaneity'],
  },
  {
    prompt: 'Your go-to first conversation topic?',
    options: ['Travel', 'Food', 'Books & films', 'Big ideas'],
  },
] as const;

export const REVEAL_COLORS = [
  { name: 'Coral', hex: '#FF5A5F' },
  { name: 'Tangerine', hex: '#FF9F1C' },
  { name: 'Sunflower', hex: '#FFD23F' },
  { name: 'Mint', hex: '#2EC4B6' },
  { name: 'Sky', hex: '#3A86FF' },
  { name: 'Violet', hex: '#8338EC' },
  { name: 'Magenta', hex: '#FF006E' },
  { name: 'Forest', hex: '#2D6A4F' },
] as const;

export const REVEAL_SYMBOLS = [
  { name: 'Star', sfSymbol: 'star.fill', materialSymbol: 'star' },
  { name: 'Heart', sfSymbol: 'heart.fill', materialSymbol: 'favorite' },
  { name: 'Moon', sfSymbol: 'moon.fill', materialSymbol: 'dark_mode' },
  { name: 'Bolt', sfSymbol: 'bolt.fill', materialSymbol: 'bolt' },
  { name: 'Leaf', sfSymbol: 'leaf.fill', materialSymbol: 'eco' },
  { name: 'Flame', sfSymbol: 'flame.fill', materialSymbol: 'local_fire_department' },
  { name: 'Sun', sfSymbol: 'sun.max.fill', materialSymbol: 'sunny' },
  { name: 'Drop', sfSymbol: 'drop.fill', materialSymbol: 'water_drop' },
] as const;

export const REPORT_REASONS = [
  { id: 'unsafe', label: 'I felt unsafe' },
  { id: 'inappropriate', label: 'Inappropriate behavior' },
  { id: 'no_show', label: 'They did not show up' },
  { id: 'other', label: 'Something else' },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]['id'];

export const FEELINGS = [
  { id: 'great', label: 'Great' },
  { id: 'fine', label: 'Fine' },
  { id: 'awkward', label: 'Awkward' },
  { id: 'uncomfortable', label: 'Uncomfortable' },
] as const;
export type Feeling = (typeof FEELINGS)[number]['id'];

export const CAMPUS_NAME = 'Stanford';
export const CAMPUS_CENTER = { latitude: 37.4275, longitude: -122.1697 };
export const CAMPUS_RADIUS_METERS = 1600;
export const ALLOWED_EMAIL_DOMAIN = 'stanford.edu';
