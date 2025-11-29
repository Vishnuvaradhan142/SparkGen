# XP System - Visual Guide

## 📊 XP Calculation Flow

```
Quiz Completed
    ↓
[Score & Correct Answers Calculated]
    ↓
Global XP = Correct Answers × 10
    ↓
Subject-Specific XP = Global XP × (1 + (Score/100) × 0.5)
    ↓
[Add to Subject Total XP]
    ↓
[Check Difficulty Upgrade Conditions]
    ↓
[Update Games Page Display]
```

---

## 🎮 XP Progression Visual

### Score Impact on Subject XP

```
Score:  50%  60%  70%  80%  85%  90%  95%  100%
XP Mult: 1.25× 1.30× 1.35× 1.40× 1.425× 1.45× 1.475× 1.50×

Example with 40 base XP:
50%  → 40 × 1.25 = 50 XP
60%  → 40 × 1.30 = 52 XP
70%  → 40 × 1.35 = 54 XP
80%  → 40 × 1.40 = 56 XP ← Common
85%  → 40 × 1.425 = 57 XP
90%  → 40 × 1.45 = 58 XP
95%  → 40 × 1.475 = 59 XP
100% → 40 × 1.50 = 60 XP ← Maximum Bonus
```

---

## 🎯 Difficulty Upgrade Path

### Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    DIFFICULTY TIERS                          │
└─────────────────────────────────────────────────────────────┘

EASY (0-499 XP)
├─ Questions: Basic concepts
├─ Average Score: Any
├─ Requirement: Default starting level
├─ Max XP: 499
└─ Probability of Upgrade: Ready when XP ≥ 500 + Score ≥ 80%

        ↓ (When: 500+ XP AND 80%+ avg)
        
MEDIUM (500-1,499 XP)
├─ Questions: Intermediate challenges
├─ Average Score: 80%+
├─ Requirement: 500+ XP + consistent 80% scores
├─ Max XP: 1,499
└─ Probability of Upgrade: Ready when XP ≥ 1500 + Score ≥ 85%

        ↓ (When: 1,500+ XP AND 85%+ avg)
        
HARD (1,500+ XP)
├─ Questions: Advanced/Challenging
├─ Average Score: 85%+
├─ Requirement: 1,500+ XP + consistent 85% scores
├─ Max XP: Unlimited
└─ Downgrade Check: If avg score drops below 70%
```

---

## 📈 Example Progression: Math Subject

### Week 1 Journey

```
DAY 1
─────────────────────────────────────────────────────────
Mon Q1: 70% (3.5/5)  → +46 XP ┐ Total: 46 | Avg: 70%
   Q2: 75% (3.75/5) → +52 XP  │ Total: 98 | Avg: 72.5%
   Q3: 72% (3.6/5)  → +50 XP  ┘ Total: 148 | Avg: 72.3%

Status: 🟢 EASY (Need 500 XP)

DAY 2
─────────────────────────────────────────────────────────
Tue Q4: 78% (3.9/5) → +54 XP ┐ Total: 202 | Avg: 73.8%
   Q5: 82% (4.1/5) → +57 XP  ┘ Total: 259 | Avg: 75.4%

Status: 🟢 EASY (Need 500 XP)

DAY 3
─────────────────────────────────────────────────────────
Wed Q6: 81% (4.05/5) → +56 XP ┐ Total: 315 | Avg: 76.8%
   Q7: 80% (4.0/5)  → +56 XP  ┘ Total: 371 | Avg: 77.7%

Status: 🟢 EASY (Need 500 XP)

DAY 4
─────────────────────────────────────────────────────────
Thu Q8:  83% (4.15/5) → +59 XP ┐ Total: 430 | Avg: 78.4%
   Q9:  82% (4.1/5)  → +57 XP  │ Total: 487 | Avg: 78.8%
   Q10: 81% (4.05/5) → +56 XP  ┘ Total: 543 | Avg: 79.0%

Status: 🟡 MEDIUM ✅ (543 XP ≥ 500 AND 79% avg)
```

### Week 2-3 Continuation

```
DAY 5-9 (MEDIUM DIFFICULTY)
─────────────────────────────────────────────────────────
Fri Q11: 84% → +59 XP │ Total: 602  | Avg: 80.2%
Sat Q12: 86% → +61 XP │ Total: 663  | Avg: 81.1%
Sun Q13: 85% → +60 XP │ Total: 723  | Avg: 81.8%
Mon Q14: 85% → +60 XP │ Total: 783  | Avg: 82.4%
Tue Q15: 87% → +62 XP │ Total: 845  | Avg: 83.1%

Status: 🟡 MEDIUM (Need 1500 XP for Hard)

WED-FRI (MEDIUM DIFFICULTY)
─────────────────────────────────────────────────────────
Wed Q16: 88% → +63 XP │ Total: 908  | Avg: 83.9%
Thu Q17: 86% → +61 XP │ Total: 969  | Avg: 84.6%
Fri Q18: 87% → +62 XP │ Total: 1031 | Avg: 85.2%

Status: 🟡 MEDIUM (Need 1500 XP for Hard - getting close!)

SAT-MON (MEDIUM DIFFICULTY)
─────────────────────────────────────────────────────────
Sat Q19: 89% → +64 XP │ Total: 1095 | Avg: 85.5%
Sun Q20: 88% → +63 XP │ Total: 1158 | Avg: 85.8%
Mon Q21: 86% → +61 XP │ Total: 1219 | Avg: 85.9%

Status: 🟡 MEDIUM (Getting close to 1500 XP!)

TUE-THU (MEDIUM DIFFICULTY)
─────────────────────────────────────────────────────────
Tue Q22: 87% → +62 XP │ Total: 1281 | Avg: 85.8%
Wed Q23: 89% → +64 XP │ Total: 1345 | Avg: 86.1%
Thu Q24: 88% → +63 XP │ Total: 1408 | Avg: 86.3%

Status: 🟡 MEDIUM (Almost there!)

FRI BREAKTHROUGH
─────────────────────────────────────────────────────────
Fri Q25: 90% → +66 XP │ Total: 1474 | Avg: 86.4%
    Q26: 92% → +69 XP │ Total: 1543 | Avg: 86.8%

Status: 🔴 HARD ✅ (1543 XP ≥ 1500 AND 86.8% avg)
        PROMOTED TO HARD DIFFICULTY!
```

---

## 💰 XP Earnings Table

### Based on Quiz Performance (5-question quiz)

```
Correct | Score | Global XP | Subject XP | Total Multiplier
─────────────────────────────────────────────────────────────
0/5     |  0%   |    0      |    0       | 1.00×
1/5     | 20%   |   10      |   12       | 1.20×
2/5     | 40%   |   20      |   24       | 1.20×
3/5     | 60%   |   30      |   39       | 1.30×
4/5     | 80%   |   40      |   56       | 1.40× ⭐
5/5     |100%   |   50      |   75       | 1.50×
```

---

## 🎓 Games Page Display

### Quiz Box Layout

```
┌──────────────────────────────┐
│ 📐 Math Quiz                 │
│ Score: 86.8% • Level: Hard   │
├──────────────────────────────┤
│ Learn advanced math topics   │
│                              │
│ Stat Box (bg-muted):         │
│ ┌────────────────────────┐   │
│ │ Attempts:        26    │   │
│ │ Best Score:      92%   │   │
│ │ XP Gained:    1,543 ✨ │   │
│ └────────────────────────┘   │
│                              │
│ [Play Again Button]          │
└──────────────────────────────┘

XP Styling:
├─ Color: text-amber-600 (light)
├─ Color: text-amber-400 (dark)
├─ Weight: font-semibold
└─ Format: 1,543 (with comma)
```

---

## 🔄 Difficulty Adjustment Logic

### Flow Diagram

```
Quiz Submitted
    ↓
Calculate Score & XP
    ↓
Add to Subject Total XP
    ↓
Add Score to Last 5
    ↓
Calculate Avg of Last 5
    ↓
Check Conditions:
    ├─ If Easy:
    │  └─ (Avg ≥ 80% AND XP ≥ 500) → UPGRADE to Medium ✅
    │
    ├─ If Medium:
    │  ├─ (Avg ≥ 85% AND XP ≥ 1500) → UPGRADE to Hard ✅
    │  └─ (Avg < 60%) → DOWNGRADE to Easy ⬇️
    │
    └─ If Hard:
       └─ (Avg < 70%) → DOWNGRADE to Medium ⬇️
    ↓
Update Database
    ↓
Return Response with New Difficulty
    ↓
Update Games Page
```

---

## 📊 Cumulative XP Over Time

### Visual Graph

```
XP
│
│ 🔴 HARD ──────────────────────── (1,500+ XP)
│         ╱────────
│        ╱         ╲
│ 🟡 MEDIUM ────────────────────── (500 XP)
│      ╱             ╲
│     ╱               ╲
│ 🟢 EASY ──────────────────────── (0 XP)
│    ╱
└─────────────────────────────────────→ Time (Days)
```

---

## 🎯 Motivation Metrics

### Progress Indicators

```
Math Subject Progress Bar:

Easy Phase:
█░░░░░░░░░░░░░░░░░░░░░░░░ (46/500 XP - 9%)

Medium Phase:
███████░░░░░░░░░░░░░░░░░░ (345/1500 XP - 23%)

Hard Phase:
████████████████████████ (1,543+ XP - Unlimited)

Next Level: Mastery (2,000+ XP goal)
██████████░░░░░░░░░░░░░░ (1,543/2,000 XP - 77%)
```

---

## 🎮 Game Design Benefits

```
1. PROGRESSION CLARITY
   ├─ Users see XP accumulate visually
   ├─ Clear path to difficulty increase
   └─ Concrete goals to work toward

2. ACHIEVEMENT MILESTONE
   ├─ 500 XP = Medium Unlock
   ├─ 1,500 XP = Hard Unlock
   └─ Long-term engagement

3. PERFORMANCE VALIDATION
   ├─ High scores = More XP bonus
   ├─ Encourages better answers
   └─ Rewards effort & understanding

4. APPROPRIATE CHALLENGE
   ├─ Dual metrics prevent gaming
   ├─ Can't get easy XP with low scores
   └─ Balanced progression
```

---

## 🎓 Learning Path Timeline

```
Week 1: Easy Mode
├─ Builds foundational knowledge
├─ Accumulates ~100-150 XP
└─ Avg score: 70-75%

Week 2-3: Medium Mode
├─ Applies intermediate concepts
├─ Accumulates ~200-300 XP/week
└─ Avg score: 80-85%

Week 4+: Hard Mode
├─ Masters advanced topics
├─ Accumulates ~300-400 XP/week
└─ Avg score: 85%+

Month 2+: Expert Status
├─ Consistently high performance
├─ 2,000+ XP accumulated
└─ Potential future "Mastery" tier
```

---

## ✨ Key Takeaways

✅ **Subject XP**: Tracks cumulative learning in each subject
✅ **Score Bonus**: Better performance = more subject XP
✅ **Dual Metrics**: Score + XP required for difficulty increase
✅ **Long-term Goal**: 1,500 XP represents ~25-30 quizzes at 80%+
✅ **Visual Progress**: Games page shows total XP at a glance
✅ **Motivation**: Clear path from Easy → Medium → Hard
✅ **Balance**: Prevents rushing through content
