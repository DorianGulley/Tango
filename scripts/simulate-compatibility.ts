import { compatibility, ITEMS, type Answers } from '../convex/compatibility';
import { MIN_MATCH_PERCENT, OPTIONAL_ITEMS } from '../convex/tangoConfig';

const PAIRS = Number(process.argv[2] ?? 20000);
const SKIP_OPTIONAL_RATE = 0.2;

function randomAnswers(): Answers {
  const answers: Answers = {};
  for (const item of ITEMS) {
    if (OPTIONAL_ITEMS.includes(item.id) && Math.random() < SKIP_OPTIONAL_RATE) continue;
    answers[item.id] =
      item.kind === 'scale'
        ? item.min + Math.floor(Math.random() * (item.max - item.min + 1))
        : item.options[Math.floor(Math.random() * item.options.length)].value;
  }
  return answers;
}

const percents: number[] = [];
const raws: number[] = [];
let gated = 0;
for (let i = 0; i < PAIRS; i++) {
  const result = compatibility(randomAnswers(), randomAnswers());
  percents.push(result.percent);
  raws.push(result.raw);
  if (result.gatesTripped.length > 0) gated++;
}
percents.sort((a, b) => a - b);
raws.sort((a, b) => a - b);
const at = (list: number[], q: number) => list[Math.min(list.length - 1, Math.floor(q * list.length))];
const share = (pred: (p: number) => boolean) => ((100 * percents.filter(pred).length) / PAIRS).toFixed(1);

console.log(`${PAIRS} random pairs`);
console.log(
  'raw     p10 %s  p50 %s  p90 %s  p99 %s',
  ...[0.1, 0.5, 0.9, 0.99].map((q) => at(raws, q).toFixed(3)),
);
console.log('percent p10 %d  p25 %d  p50 %d  p75 %d  p90 %d  p99 %d', ...[0.1, 0.25, 0.5, 0.75, 0.9, 0.99].map((q) => at(percents, q)));
console.log(`any gate tripped: ${((100 * gated) / PAIRS).toFixed(1)}%`);
for (let lo = 0; lo < 100; lo += 10) {
  const n = percents.filter((p) => p >= lo && (lo === 90 ? p <= 100 : p < lo + 10)).length;
  console.log(`${String(lo).padStart(2)}-${lo === 90 ? 100 : lo + 9}  ${'#'.repeat(Math.round((60 * n) / PAIRS))} ${((100 * n) / PAIRS).toFixed(1)}%`);
}
console.log(`share >= ${MIN_MATCH_PERCENT}: ${share((p) => p >= MIN_MATCH_PERCENT)}%`);
