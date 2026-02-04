# Rating System and Skill Optimization

This document explains how the rating calculator and skill optimizer score builds in UmaTools.
It reflects the current logic in `rating-shared.js`, `optimizer.js`, and `calculator.js`.

## Files and Data Sources

- `rating-shared.js` defines stat scoring, unique bonus, badge thresholds, and skill score aggregation.
- `optimizer.js` handles skill selection, cost discounts, dependency grouping, and the optimization algorithm.
- `calculator.js` is the lightweight rating calculator that uses the shared rating engine.
- `assets/uma_skills.csv` provides skill names, score buckets, and affinity roles.
- `assets/skills_all.json` provides base costs plus parent/lower relationships.
- `libs/skills_lib.json` is a fallback library if CSV data is unavailable.

## Rating Formula

Total rating is the sum of three components:

```
total = statsScore + uniqueBonus + skillScore
```

### Stat Scoring

Each stat (Speed, Stamina, Power, Guts, Wisdom) is clamped to `0..2000`, then scored in 50-point blocks.
The block multipliers are:

| Block Index | Stat Range | Multiplier |
| --- | --- | --- |
| 0 | 0-49 | 0.5 |
| 1 | 50-99 | 0.8 |
| 2 | 100-149 | 1.0 |
| 3 | 150-199 | 1.3 |
| 4 | 200-249 | 1.6 |
| 5 | 250-299 | 1.8 |
| 6 | 300-349 | 2.1 |
| 7 | 350-399 | 2.4 |
| 8 | 400-449 | 2.6 |
| 9 | 450-499 | 2.8 |
| 10 | 500-549 | 2.9 |
| 11 | 550-599 | 3.0 |
| 12 | 600-649 | 3.1 |
| 13 | 650-699 | 3.3 |
| 14 | 700-749 | 3.4 |
| 15 | 750-799 | 3.5 |
| 16 | 800-849 | 3.9 |
| 17 | 850-899 | 4.1 |
| 18 | 900-949 | 4.2 |
| 19 | 950-999 | 4.3 |
| 20 | 1000-1049 | 5.2 |
| 21 | 1050-1099 | 5.5 |
| 22 | 1100-1149 | 6.6 |
| 23 | 1150-1199 | 6.8 |
| 24 | 1200-1249 | 6.9 |
| 25+ | 1250-2000 | 6.9 (reused) |

Stat scoring math:

```
blocks = floor(stat / 50)
remainder = stat % 50
blockSum = sum_{i=0..blocks-1} (mult[i] * 50)
remainderSum = mult[min(blocks, last)] * (remainder + 1)
statScore = floor(blockSum + remainderSum)
```

Notes:

- When `blocks` exceeds the multiplier list, the final multiplier (6.9) is reused.
- The `remainder + 1` term means even an exact block boundary uses a small amount of the next block before flooring.

### Unique Skill Bonus

Unique skill bonus depends on star level:

```
uniqueBonus = uniqueLevel * multiplier
multiplier = 120 if starLevel is 1 or 2
multiplier = 170 otherwise
```

If `uniqueLevel` is `0`, the bonus is `0`.

### Rating Badges

Badges are chosen by the first threshold where `total < threshold`.
Ranges are `[previousThreshold, currentThreshold)`.

| Max Total (exclusive) | Badge |
| --- | --- |
| 300 | G |
| 600 | G+ |
| 900 | F |
| 1300 | F+ |
| 1800 | E |
| 2300 | E+ |
| 2900 | D |
| 3500 | D+ |
| 4900 | C |
| 6500 | C+ |
| 8200 | B |
| 10000 | B+ |
| 12100 | A |
| 14500 | A+ |
| 15900 | S |
| 17500 | S+ |
| 19200 | SS |
| 19600 | SS+ |
| 20000 | UG |
| 20400 | UG1 |
| 20800 | UG2 |
| 21200 | UG3 |
| 21600 | UG4 |
| 22100 | UG5 |
| 22500 | UG6 |
| 23000 | UG7 |
| 23400 | UG8 |
| 23900 | UG9 |
| 24300 | UF |
| 24800 | UF1 |
| 25300 | UF2 |
| 25800 | UF3 |
| 26300 | UF4 |
| 26800 | UF5 |
| 27300 | UF6 |
| 27800 | UF7 |
| Infinity | UF7 |

The progress bar uses the current badge threshold and previous threshold to compute progress and points needed to the next badge.

## Skill Scoring

### Score Buckets

Skill scores can be a single number or a bucketed object:

- `base`
- `good`
- `average`
- `bad`
- `terrible`

Bucket selection is based on the skill `checkType` and the race config selections:

| Grade | Bucket |
| --- | --- |
| S, A | good |
| B, C | average |
| D, E, F | bad |
| Anything else | terrible |

If a skill has no `checkType`, the bucket is `base`.

### checkType Mapping

`checkType` maps to the following race config fields:

- `turf`
- `dirt`
- `sprint`
- `mile`
- `medium`
- `long`
- `front`
- `pace`
- `late`
- `end`

### Evaluation Rules

- If `skill.score` is a number, it is used directly.
- If `skill.score` is an object, `score[bucket]` is used.
- Missing scores default to `0`.

The optimizer sums rating scores from the chosen skills. Lower skills that are part of a gold combo are excluded to avoid double counting.

## Skill Costs and Discounts

### Cost Resolution

Base costs are resolved in this order:

1. `assets/skills_all.json` by exact or normalized name.
2. `assets/uma_skills.csv` `base` or `base_value` columns.

`skills_all.json` also provides parent and lower skill relationships used for dependency grouping.

### Hint Discount and Fast Learner

Hint discount levels are:

- Lv0: 0%
- Lv1: 10%
- Lv2: 20%
- Lv3: 30%
- Lv4: 35%
- Lv5: 40%

Fast Learner adds an extra 10% discount.
Final cost is:

```
finalCost = floor(baseCost * max(0, 1 - hintDiscount - fastLearnerDiscount))
```

If you manually enter a cost, that value is used directly.

## Gold and Lower Skill Dependencies

Gold skills can depend on lower (single-circle) skills.
The optimizer groups related rows into a single decision group with mutually exclusive options:

- None
- Lower only
- Gold upgrade (with lower included)

If a gold skill is linked to its lower skill row, the gold cost is treated as already including the lower cost.
In results, lower skills included in gold combos are shown as "included with" and do not add score separately.

## Optimization Engine

### Modes

- Rating mode maximizes total rating score from skills.
- Aptitude Test mode maximizes aptitude first, rating second.

Aptitude Test scoring:

- Normal skills: 400 points
- Gold skills: 1200 points
- Lower skills included in gold combos: 0 points

Optimization score for aptitude mode is:

```
combinedScore = (aptitudeScore * 100000) + ratingScore
```

### Algorithm Summary

1. Collect valid skill rows (recognized skill name, numeric cost).
2. Expand required skills to include parents and lower dependencies.
3. Build dependency groups to handle gold-lower choices.
4. Run a group knapsack DP to maximize score under budget.
5. Reconstruct chosen items, then add required items.
6. Compute final rating skill score and update the rating engine.

If required cost exceeds budget, optimization fails with `required_unreachable`.

## Auto Build (Ideal Build)

Auto Build only considers skills that match selected targets:

- A skill with a `checkType` is included only if that `checkType` is selected and its bucket is `good` (S/A).
- Skills without a `checkType` are included only if `General` is selected.

The result is optimized with the same engine used for manual builds, and matching rows are highlighted.

## Practical Optimization Tips

- Set race aptitudes first. They directly control which score bucket a skill uses.
- Prioritize skills whose `checkType` matches your strongest aptitudes (S/A).
- Keep costs accurate and set hint levels so discounts are applied correctly.
- Use required locks sparingly and verify your budget can cover them.
- For gold skills, include their lower versions so the optimizer can choose the best combo.
- Use Auto Build for a baseline, then lock must-have skills and re-optimize.
- Pick Rating or Aptitude Test mode based on your goal; the optimizer changes its objective accordingly.

## Troubleshooting and Edge Cases

- Stats above 2000 are clamped.
- Unknown skills or missing costs are ignored.
- If CSV or JSON skill data fails to load, a tiny fallback library is used.
- When required skills exceed budget, the optimizer returns an error and shows no picks.
