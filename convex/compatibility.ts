/**
 * Pairwise compatibility from each person's OWN answers only.
 *
 * Two lists:
 *   ITEMS      what the user sees (29 questions, ~5 min)
 *   COMPONENTS how pairs of answers are scored, with designer-set weights
 *
 * Weights are research-informed priors, not fit to outcomes. Tune them once you
 * have any real signal. Age / gender / orientation / location should be hard
 * pre-filters in the profile, outside this quiz.
 */

export type Answers = Record<string, string | number>;

// ───────────────────────── Items (what users answer) ─────────────────────────

type Item =
  | { id: string; text: string; kind: "scale"; min: number; max: number; lo: string; hi: string }
  | { id: string; text: string; kind: "choice"; options: { value: string; label: string }[] };

const agree = (id: string, text: string): Item => ({
  id, text, kind: "scale", min: 1, max: 5, lo: "Strongly disagree", hi: "Strongly agree",
});
const scale = (id: string, text: string, lo: string, hi: string, max = 5): Item => ({
  id, text, kind: "scale", min: 1, max, lo, hi,
});
const choice = (id: string, text: string, options: [string, string][]): Item => ({
  id, text, kind: "choice", options: options.map(([value, label]) => ({ value, label })),
});

export const ITEMS: Item[] = [
  // Intent & structure (gates)
  choice("intent", "What are you looking for right now?", [
    ["casual", "Something casual and fun"],
    ["open", "Open to seeing where it goes"],
    ["long_term", "A long-term relationship"],
    ["marriage", "Marriage-minded: looking for my person"],
  ]),
  choice("kids", "Do you want kids someday?", [
    ["yes", "Yes"], ["probably_yes", "Probably"], ["unsure", "Not sure"],
    ["probably_no", "Probably not"], ["no", "No"],
  ]),
  choice("monogamy", "What relationship structure fits you?", [
    ["mono", "Monogamous"],
    ["mono_open", "Mostly monogamous, open to discussing other setups"],
    ["non_mono", "Non-monogamous / open relationship"],
  ]),

  // Values & life
  scale("religion", "How important is religion or spirituality in your life?", "Not at all", "Central to my life"),
  scale("politics", "Where do you land politically?", "Very progressive", "Very conservative", 7),
  choice("life_priority", "Which sounds most like your next five years?", [
    ["career", "Building my career"],
    ["family", "Building a home and family"],
    ["adventure", "Travel and new experiences"],
    ["creative", "Creative or personal projects"],
    ["security", "Financial stability and routine"],
    ["community", "Community, causes, or impact"],
  ]),
  scale("money", "How do you approach money?", "Spend and enjoy it", "Save and plan ahead"),
  choice("live_where", "Where do you picture living long-term?", [
    ["big_city", "Big city"],
    ["suburb", "Suburb or mid-size city"],
    ["small_town", "Small town or rural"],
    ["flexible", "Anywhere, really"],
  ]),
  scale("family", "How big a role does family play in your day-to-day life?", "Small", "Huge"),
  agree("roles", "I'm drawn to fairly traditional roles in a relationship."),

  // Personality (short Big Five, one item each)
  agree("emo_stability", "I stay pretty calm when things go wrong."),
  agree("agreeableness", "I'm warm and quick to give people the benefit of the doubt."),
  agree("conscientiousness", "I plan ahead and follow through on what I commit to."),
  agree("extraversion", "Being around lots of people energizes me."),
  agree("openness", "I love trying new things: foods, places, ideas."),

  // Attachment (2 items per dimension)
  agree("anx1", "I worry that people I'm close to will lose interest in me."),
  agree("anx2", "I need a lot of reassurance that I'm loved."),
  agree("avo1", "I get uncomfortable when someone wants to get very emotionally close."),
  agree("avo2", "I'd rather handle problems on my own than lean on a partner."),

  // How you do relationships
  choice("conflict", "When you disagree with a partner, you usually…", [
    ["talk_now", "Talk it out right away"],
    ["cool_off", "Take some space, then talk"],
    ["avoid", "Let it go or avoid the topic"],
    ["heated", "Get heated, then move on fast"],
  ]),
  agree("emo_open", "I'm comfortable talking openly about my feelings."),
  scale("autonomy", "Ideal time together vs. apart?", "Lots of time on my own", "Together almost all the time"),
  scale("intimacy", "How important is physical intimacy in a relationship?", "Not very", "Extremely"),
  agree("growth", "Even great relationships take ongoing work."),

  // Lifestyle
  agree("tidy", "My living space is usually tidy and organized."),
  scale("activity", "How active is your lifestyle?", "Mostly relaxed", "Very active"),
  scale("drinking", "How often do you drink alcohol?", "Never", "Often"),
  choice("smoking", "Do you use nicotine or cannabis?", [
    ["never", "Never"], ["sometimes", "Sometimes"], ["regularly", "Regularly"],
  ]),
  choice("humor", "Your humor is mostly…", [
    ["silly", "Silly / goofy"],
    ["dry", "Dry / deadpan"],
    ["dark", "Dark / edgy"],
    ["witty", "Witty / wordplay"],
    ["story", "Storytelling / observational"],
  ]),
];

// ───────────────────────── Scoring components ─────────────────────────

type Gate = { below: number; mult: number }; // if score < below, final % is multiplied by mult

type Component = {
  id: string;
  label: string;
  weight: number;
  uses: string[];
  score: (a: Answers, b: Answers) => number; // 0..1
  gate?: Gate;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const num = (v: string | number) => Number(v);

/** closer answers = higher score */
const similarity = (id: string, label: string, weight: number, min = 1, max = 5): Component => ({
  id, label, weight, uses: [id],
  score: (a, b) => 1 - Math.abs(num(a[id]) - num(b[id])) / (max - min),
});

/** more is universally better; the weaker partner drags the score (blend of min and mean) */
const weakestLink = (id: string, label: string, weight: number, min = 1, max = 5): Component => ({
  id, label, weight, uses: [id],
  score: (a, b) => {
    const x = num(a[id]), y = num(b[id]);
    return clamp01((0.65 * Math.min(x, y) + 0.35 * ((x + y) / 2) - min) / (max - min));
  },
});

/** symmetric lookup: "a|b" or "b|a"; identical answers default to 1 unless overridden */
const lookup = (
  id: string, label: string, weight: number,
  pairs: Record<string, number>, fallback: number, gate?: Gate,
): Component => ({
  id, label, weight, uses: [id], gate,
  score: (a, b) => {
    const x = String(a[id]), y = String(b[id]);
    return pairs[`${x}|${y}`] ?? pairs[`${y}|${x}`] ?? (x === y ? 1 : fallback);
  },
});

const norm = (v: number) => (v - 1) / 4; // 1..5 -> 0..1

export const COMPONENTS: Component[] = [
  // Gates: intent, kids, structure
  lookup("intent", "Relationship goals", 10, {
    "casual|open": 0.6, "casual|long_term": 0.15, "casual|marriage": 0,
    "open|long_term": 0.7, "open|marriage": 0.4, "long_term|marriage": 0.8,
  }, 0.3, { below: 0.2, mult: 0.4 }),

  lookup("kids", "Kids", 10, {
    "yes|probably_yes": 0.9, "yes|unsure": 0.5, "yes|probably_no": 0.1, "yes|no": 0,
    "probably_yes|unsure": 0.75, "probably_yes|probably_no": 0.3, "probably_yes|no": 0.1,
    "unsure|probably_no": 0.75, "unsure|no": 0.5, "unsure|unsure": 0.9,
    "probably_no|no": 0.9,
  }, 0.3, { below: 0.2, mult: 0.3 }),

  lookup("monogamy", "Relationship structure", 8, {
    "mono|mono_open": 0.4, "mono|non_mono": 0, "mono_open|non_mono": 0.8,
  }, 0.3, { below: 0.2, mult: 0.3 }),

  // Attachment: the anxious-avoidant trap is the main penalty
  {
    id: "attachment", label: "Attachment fit", weight: 7,
    uses: ["anx1", "anx2", "avo1", "avo2"],
    gate: { below: 0.3, mult: 0.8 }, // anxious-avoidant pairing: soft penalty
    score: (a, b) => {
      const anxA = norm((num(a.anx1) + num(a.anx2)) / 2), avoA = norm((num(a.avo1) + num(a.avo2)) / 2);
      const anxB = norm((num(b.anx1) + num(b.anx2)) / 2), avoB = norm((num(b.avo1) + num(b.avo2)) / 2);
      const trap = Math.max(anxA * avoB, anxB * avoA);
      return clamp01(1 - 0.75 * trap - 0.35 * avoA * avoB - 0.2 * anxA * anxB);
    },
  },

  lookup("conflict", "Conflict style", 5, {
    "talk_now|cool_off": 0.65, "talk_now|avoid": 0.15, "talk_now|heated": 0.55,
    "cool_off|avoid": 0.55, "cool_off|heated": 0.45, "avoid|heated": 0.15,
    "avoid|avoid": 0.5, "heated|heated": 0.4,
  }, 0.4),

  // Values
  similarity("religion", "Role of religion", 5),
  similarity("politics", "Politics", 4, 1, 7),
  lookup("life_priority", "Life priorities", 4, {
    "career|security": 0.6, "career|creative": 0.45, "career|community": 0.4,
    "career|family": 0.3, "career|adventure": 0.25,
    "family|security": 0.6, "family|community": 0.5, "family|creative": 0.3, "family|adventure": 0.25,
    "adventure|creative": 0.6, "adventure|community": 0.4, "adventure|security": 0.15,
    "creative|community": 0.5, "creative|security": 0.3, "community|security": 0.35,
  }, 0.3),
  similarity("money", "Money style", 4),
  similarity("roles", "Relationship roles", 4),
  lookup("live_where", "Where to live", 3, {
    "big_city|suburb": 0.6, "big_city|small_town": 0.15, "big_city|flexible": 0.85,
    "suburb|small_town": 0.6, "suburb|flexible": 0.9, "small_town|flexible": 0.85,
  }, 0.5),
  similarity("family", "Family involvement", 3),

  // Personality
  weakestLink("emo_stability", "Emotional steadiness", 4),
  weakestLink("agreeableness", "Warmth", 3),
  similarity("conscientiousness", "Organization", 3),
  similarity("extraversion", "Social energy", 3),
  similarity("openness", "Openness to new things", 3),

  // How you do relationships
  similarity("emo_open", "Emotional openness", 3),
  similarity("autonomy", "Together vs. apart", 4),
  similarity("intimacy", "Physical intimacy", 4),
  weakestLink("growth", "Belief in working at it", 3),

  // Lifestyle
  similarity("tidy", "Tidiness", 3),
  similarity("activity", "Activity level", 3),
  similarity("drinking", "Drinking", 3),
  lookup("smoking", "Nicotine / cannabis", 4, {
    "never|sometimes": 0.55, "never|regularly": 0.2, "sometimes|regularly": 0.75,
  }, 0.5),
  lookup("humor", "Humor", 3, {
    "silly|dry": 0.35, "silly|dark": 0.3, "silly|witty": 0.55, "silly|story": 0.6,
    "dry|dark": 0.75, "dry|witty": 0.75, "dry|story": 0.5,
    "dark|witty": 0.55, "dark|story": 0.45, "witty|story": 0.6,
  }, 0.4),
];

const TOTAL_WEIGHT = COMPONENTS.reduce((s, c) => s + c.weight, 0);

// Raw weighted similarity for a random pair lands near RAW_LOW; a near-perfect pair near RAW_HIGH.
// Stretch so the displayed percent is spread out. Re-tune by simulating random answer sets.
const RAW_LOW = 0.5;
const RAW_HIGH = 0.95;

export type Result = {
  percent: number;          // 0-100
  raw: number;              // weighted mean similarity, 0-1
  coverage: number;         // share of total weight with data from both people
  reliable: boolean;        // coverage >= 0.7
  gatesTripped: string[];   // dealbreaker-type mismatches that lowered the score
  strengths: string[];      // top aligned areas ("why you matched")
  frictions: string[];      // biggest mismatches
};

export function compatibility(a: Answers, b: Answers): Result {
  let earned = 0, total = 0, mult = 1;
  const gatesTripped: string[] = [];
  const parts: { label: string; s: number; w: number }[] = [];

  for (const c of COMPONENTS) {
    if (!c.uses.every((id) => a[id] != null && b[id] != null)) continue;
    const s = clamp01(c.score(a, b));
    earned += c.weight * s;
    total += c.weight;
    parts.push({ label: c.label, s, w: c.weight });
    if (c.gate && s < c.gate.below) {
      mult *= c.gate.mult;
      gatesTripped.push(c.label);
    }
  }

  const raw = total ? earned / total : 0;
  const stretched = clamp01((raw - RAW_LOW) / (RAW_HIGH - RAW_LOW)) * 100;
  const coverage = total / TOTAL_WEIGHT;

  const strengths = parts.filter((p) => p.s >= 0.85).sort((x, y) => y.w * y.s - x.w * x.s).slice(0, 3).map((p) => p.label);
  const frictions = parts.filter((p) => p.s < 0.5).sort((x, y) => y.w * (1 - y.s) - x.w * (1 - x.s)).slice(0, 3).map((p) => p.label);

  return {
    percent: Math.round(stretched * mult),
    raw, coverage, reliable: coverage >= 0.7,
    gatesTripped, strengths, frictions,
  };
}
