# Subject-Specific XP System & Adaptive Difficulty

## 📊 Overview

The XP (Experience Points) system now tracks progress per subject and automatically increases difficulty based on **both score performance AND XP gained**. This dual-metric system ensures players are challenged appropriately as they progress.

---

## 🎮 How XP is Calculated

### Global XP
- **Base:** 10 XP per correct answer
- **Formula:** `earnedXP = correct × 10`

### Subject-Specific XP
- **Enhanced Calculation:** Score-based bonus
- **Formula:** `subjectXpGained = earnedXP × (1 + (score/100) × 0.5)`
- **Impact:** Higher scores = more subject XP

#### Example Calculation
```
Quiz Score: 80% (4/5 correct)
Global XP earned: 4 × 10 = 40 XP
Subject XP bonus: 40 × (1 + (80/100) × 0.5)
               = 40 × (1 + 0.4)
               = 40 × 1.4
               = 56 XP (Subject-Specific)

Total in this subject: +56 XP
```

---

## 🎯 Difficulty Progression System

### XP Thresholds Required

```
Easy Difficulty
    ↓ (Need 80%+ avg score AND 500+ XP)
    ↓
Medium Difficulty
    ↓ (Need 85%+ avg score AND 1500+ XP)
    ↓
Hard Difficulty
```

### Difficulty Adjustment Logic

#### **Easy → Medium (UPGRADE)**
```
Conditions:
✓ Average score of last 5 quizzes ≥ 80%
✓ Total subject XP ≥ 500
✓ Current difficulty = Easy

Action: Automatically upgrade to Medium
Logs: "[SUBJECT] Difficulty upgraded: easy → medium"
```

#### **Medium → Hard (UPGRADE)**
```
Conditions:
✓ Average score of last 5 quizzes ≥ 85%
✓ Total subject XP ≥ 1500
✓ Current difficulty = Medium

Action: Automatically upgrade to Hard
Logs: "[SUBJECT] Difficulty upgraded: medium → hard"
```

#### **Medium → Easy (DOWNGRADE)**
```
Conditions:
✓ Average score of last 5 quizzes < 60%
✓ Current difficulty = Medium

Action: Automatically downgrade to Easy
Logs: "[SUBJECT] Difficulty downgraded: medium → easy"
```

#### **Hard → Medium (DOWNGRADE)**
```
Conditions:
✓ Average score of last 5 quizzes < 70%
✓ Current difficulty = Hard

Action: Automatically downgrade to Medium
Logs: "[SUBJECT] Difficulty downgraded: hard → medium"
```

---

## 📱 Frontend Display (Games Page)

### Quiz Box Stats
```
┌─────────────────────────────────┐
│ 📐 Math Quiz                    │
│ Score: 84.5% • Level: Medium    │
├─────────────────────────────────┤
│ Learn mathematics basics...     │
│                                 │
│ Attempts:    5                  │
│ Best Score:  92%                │
│ XP Gained:   2,340              │ ← NEW
│                                 │
│ [Play Again]                    │
└─────────────────────────────────┘
```

### XP Display Details
- **Color:** Amber/Gold (text-amber-600 in light mode, text-amber-400 in dark mode)
- **Styling:** Font-semibold for emphasis
- **Format:** Total XP as integer (e.g., 2,340)
- **Location:** Bottom of stats box

---

## 💾 Database Schema

### User.subjectScores Map

```javascript
{
  subject: String,
  attempts: Number,
  averageScore: Number,
  bestScore: Number,
  totalXP: Number,              // NEW: Cumulative XP for subject
  recentScores: Array[Number],  // Last 10 scores
  currentDifficulty: String,    // 'easy', 'medium', 'hard'
  scoreHistory: Array[{
    score: Number,
    xpGained: Number,           // NEW: XP earned in this quiz
    date: Date,
    difficulty: String
  }]
}
```

### Example Document

```javascript
user.subjectScores.get('math') = {
  subject: 'math',
  attempts: 12,
  averageScore: 82.5,
  bestScore: 95,
  totalXP: 1650,                    // Cumulative XP
  recentScores: [85, 88, 80, 92, 78, 81, 89, 86, 90, 84],
  currentDifficulty: 'hard',        // Upgraded at 1500 XP
  scoreHistory: [
    { score: 92, xpGained: 115, date: 2025-11-27T10:30:00, difficulty: 'medium' },
    { score: 88, xpGained: 108, date: 2025-11-27T09:15:00, difficulty: 'medium' },
    // ... more history
  ]
}
```

---

## 🔄 Quiz Submission Flow

### Request
```javascript
POST /quiz/submit
{
  "quizId": "507f1f77bcf86cd799439011",
  "answers": [
    { "questionId": "...", "answer": "B" },
    { "questionId": "...", "answer": "A" },
    // ...
  ]
}
```

### Response
```javascript
{
  score: 80,                    // Percentage
  correct: 4,                   // Correct answers
  total: 5,                     // Total questions
  earnedXP: 40,                 // Global XP
  subjectXpGained: 56,          // Subject-specific XP (NEW)
  newLevel: 5,                  // User level
  leveledUp: false,             // Level change
  achievements: [],             // New achievements
  questionsWithAnswers: [...],  // Question details
  subjectData: {
    subject: 'math',
    attempts: 12,
    averageScore: 82.5,
    bestScore: 95,
    totalXP: 1650,              // NEW: Updated subject XP
    currentDifficulty: 'hard'   // NEW: Updated difficulty
  }
}
```

---

## 📊 API Endpoints

### GET /quiz/subject-stats/:subject
Returns subject-specific statistics including XP
```javascript
{
  subject: 'math',
  attempts: 12,
  averageScore: 82.5,
  bestScore: 95,
  totalXP: 1650,                // NEW
  currentDifficulty: 'hard',
  recentScores: [90, 84, 88],
  scoreHistory: [...]
}
```

### GET /quiz/all-subject-stats
Returns all subject statistics
```javascript
{
  subjects: [
    {
      subject: 'math',
      attempts: 12,
      averageScore: 82.5,
      bestScore: 95,
      totalXP: 1650,            // NEW
      currentDifficulty: 'hard',
      recentScores: [90, 84, 88]
    },
    // ... more subjects
  ]
}
```

---

## 🎓 Progression Example

### Student Journey: Math Subject

**Session 1: Day 1**
```
Quiz 1: Score 72% (3/5)
├─ Global XP: 30
├─ Subject XP: 30 × (1 + 0.72×0.5) = 41 XP
├─ Total Subject XP: 41
├─ Difficulty: Easy (Not enough XP)
└─ Avg of last 5: 72%

Quiz 2: Score 75% (3.75/5)
├─ Global XP: 30
├─ Subject XP: 30 × (1 + 0.75×0.5) = 42 XP
├─ Total Subject XP: 83
├─ Difficulty: Easy (Not enough XP)
└─ Avg of last 5: 73.5%
```

**Session 2: Day 2**
```
Quiz 3: Score 85% (4.25/5)
├─ Global XP: 42
├─ Subject XP: 42 × (1 + 0.85×0.5) = 59 XP
├─ Total Subject XP: 142
├─ Difficulty: Easy
└─ Avg of last 5: 77%

Quiz 4: Score 80% (4/5)
├─ Global XP: 40
├─ Subject XP: 40 × (1 + 0.80×0.5) = 56 XP
├─ Total Subject XP: 198
├─ Difficulty: Easy
└─ Avg of last 5: 80%

Quiz 5: Score 88% (4.4/5)
├─ Global XP: 44
├─ Subject XP: 44 × (1 + 0.88×0.5) = 63 XP
├─ Total Subject XP: 261
├─ Difficulty: Easy
└─ Avg of last 5: 81.6%
```

**Session 3: Day 3**
```
Quiz 6: Score 82% (4.1/5)
├─ Global XP: 41
├─ Subject XP: 41 × (1 + 0.82×0.5) = 58 XP
├─ Total Subject XP: 319
├─ Difficulty: Easy
└─ Avg of last 5: 81%

Quiz 7: Score 79% (3.95/5)
├─ Global XP: 39
├─ Subject XP: 39 × (1 + 0.79×0.5) = 54 XP
├─ Total Subject XP: 373
├─ Difficulty: Easy
└─ Avg of last 5: 80.8%

Quiz 8: Score 84% (4.2/5)
├─ Global XP: 42
├─ Subject XP: 42 × (1 + 0.84×0.5) = 60 XP
├─ Total Subject XP: 433
├─ Difficulty: Easy
└─ Avg of last 5: 81.4%

Quiz 9: Score 83% (4.15/5)
├─ Global XP: 41
├─ Subject XP: 41 × (1 + 0.83×0.5) = 58 XP
├─ Total Subject XP: 491
├─ Difficulty: Easy (Very close!)
└─ Avg of last 5: 81.6%

Quiz 10: Score 81% (4.05/5)
├─ Global XP: 40
├─ Subject XP: 40 × (1 + 0.81×0.5) = 56 XP
├─ Total Subject XP: 547
├─ Difficulty: **MEDIUM** ✅ (Avg: 80%, XP: 547 ≥ 500)
└─ Avg of last 5: 81%
```

**Session 4-5: Continuing with Medium Difficulty**
```
After several more quizzes with consistent 85%+ scores
and accumulating more XP...

Total Subject XP reaches: 1,500+
Last 5 avg: 86%+
Difficulty: **HARD** ✅ (Promoted to Hard mode)
```

---

## 🎮 XP Progression Milestones

### For Each Subject

| Milestone | XP Required | Avg Score | Current Difficulty |
|-----------|------------|-----------|-------------------|
| Beginner | 0-499 | Any | Easy |
| Intermediate | 500-1,499 | 80%+ | Medium |
| Advanced | 1,500+ | 85%+ | Hard |

---

## 🔐 Safeguards

### Downgrade Protection
- Players won't drop back to Easy from Medium unless they consistently score below 60%
- Players won't drop back to Medium from Hard unless they consistently score below 70%
- **Reason:** Prevents frustration from occasional bad attempts

### Upgrade Requirements
- **Two conditions must be met:**
  1. Score performance threshold (last 5 average)
  2. XP threshold must be reached
- **Reason:** Ensures adequate practice before increasing difficulty

---

## 📈 Monitoring Progress

### Console Logs (Backend)

```
[MATH] Last 5 avg score: 82.50%, Total XP: 1650, Current difficulty: hard
[MATH] Difficulty upgraded: medium → hard (Avg: 86.2%, XP: 1550)
[MATH] Difficulty downgraded: hard → medium (Avg: 68.5%)
Quiz submission processed. Score: 85%, Global XP: 42, Subject XP: 60, 
Subject: math, Subject Total XP: 1650, New Difficulty: hard
```

### Frontend Display
- Games page shows current subject XP in amber/gold color
- Updated after each quiz submission
- Real-time reflection of progress

---

## 🚀 Implementation Details

### Modified Files

1. **server/models/User.js**
   - Added `totalXP` field to subjectScores
   - Added `xpGained` to scoreHistory

2. **server/routes/quiz.js**
   - Calculate subject-specific XP in submission handler
   - Implement dual-metric difficulty logic
   - Updated all response endpoints with XP data
   - Enhanced logging with XP details

3. **client/src/pages/Games.tsx**
   - Display totalXP in quiz boxes
   - Styled with amber color for emphasis
   - Shows alongside Attempts and Best Score

---

## ✅ Testing Checklist

- [ ] XP is calculated correctly per quiz (base + score bonus)
- [ ] Subject-specific XP accumulates across quizzes
- [ ] Difficulty upgrades when both conditions met (score + XP)
- [ ] Difficulty downgrades when score drops below threshold
- [ ] Games page displays XP in correct format
- [ ] Console logs show XP progression
- [ ] Response includes subjectXpGained and totalXP
- [ ] Score history includes xpGained field
- [ ] Backward compatibility with existing users

---

## 📝 Notes

- **XP accumulates forever** - never decreases for a subject
- **Difficulty can change** - but XP progress is permanent
- **Bonus scaling** - Score multiplier: 0.5× per 100% (max 1.5× at 100%)
- **Trend analysis** - Uses last 5 scores for stability
- **Persistence** - All XP data saved to MongoDB

---

## 🔮 Future Enhancements

Potential additions:
- XP leaderboards per subject
- Daily/weekly XP challenges
- XP-based achievements ("1000 XP Club")
- Subject mastery levels based on XP tiers
- XP booster items/power-ups
- XP decay option (advanced users)
- Comparative XP statistics
