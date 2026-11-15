import { describe, expect, test } from 'vitest';

import { compatibility, ITEMS, type Answers } from './compatibility';

function firstAnswers(): Answers {
  return Object.fromEntries(
    ITEMS.map((item) => [item.id, item.kind === 'scale' ? item.min : item.options[0].value]),
  );
}

describe('compatibility', () => {
  test('an identical pair scores 100', () => {
    const a: Answers = { ...firstAnswers(), anx1: 1, anx2: 1, avo1: 1, avo2: 1 };
    for (const id of ['emo_stability', 'agreeableness', 'growth']) a[id] = 5;
    const result = compatibility(a, { ...a });
    expect(result.percent).toBe(100);
    expect(result.reliable).toBe(true);
    expect(result.gatesTripped).toEqual([]);
  });

  test('kids yes vs no trips the Kids gate', () => {
    const a: Answers = { ...firstAnswers(), kids: 'yes' };
    const b: Answers = { ...a, kids: 'no' };
    const result = compatibility(a, b);
    expect(result.gatesTripped).toContain('Kids');
    expect(result.frictions).toContain('Kids');
    expect(result.percent).toBeLessThan(compatibility(a, { ...a }).percent * 0.31);
  });

  test('a missing politics answer is skipped and still reliable', () => {
    const a = firstAnswers();
    const b = firstAnswers();
    delete b.politics;
    const result = compatibility(a, b);
    expect(Number.isFinite(result.percent)).toBe(true);
    expect(result.coverage).toBeLessThan(1);
    expect(result.reliable).toBe(true);
  });
});
