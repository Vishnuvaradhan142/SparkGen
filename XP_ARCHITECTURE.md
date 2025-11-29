# 🏗️ XP System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SPARKGEN XP SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

                          CLIENT (React)
                                │
                    ┌───────────┴───────────┐
                    │                       │
            Games Page                 Quiz Page
            (Display XP)           (Attempt Quiz)
                    │                       │
                    └───────────┬───────────┘
                                │
                         API Calls
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    GET /quiz/*          POST /quiz/submit        GET /quiz/**
    (Fetch XP)           (Submit Quiz)            (Subject Stats)
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                        Express Backend
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    Calculate XP          Update Database          Return Stats
    with Bonus               (User Model)              (with XP)
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                          MongoDB
                                │
                    ┌───────────┴───────────┐
                    │                       │
            Subject XP Pool            Score History
            (Cumulative)          (Includes XP Gained)
```

---

## 🔄 Data Flow: Quiz Submission

```
1. USER SUBMITS QUIZ
   └─ POST /quiz/submit { quizId, answers[] }

2. CALCULATE SCORE
   ├─ Count correct answers
   └─ Calculate percentage

3. CALCULATE XP
   ├─ Global XP = Correct × 10
   └─ Subject XP = Global × (1 + (Score/100) × 0.5)
      └─ Example: 4 correct, 80% → 56 Subject XP

4. UPDATE SUBJECT STATS
   ├─ Add to totalXP (cumulative)
   ├─ Add to recentScores (for trending)
   └─ Add to scoreHistory (with xpGained field)

5. CHECK DIFFICULTY UPGRADE
   ├─ Calculate avg of last 5 scores
   ├─ Check if upgrade conditions met:
   │  ├─ Easy→Medium: 80% avg AND XP ≥ 500
   │  └─ Medium→Hard: 85% avg AND XP ≥ 1500
   └─ Update difficulty if qualified

6. SAVE TO DATABASE
   └─ User.subjectScores[subject] = updated data

7. RETURN RESPONSE
   └─ Include earnedXP, subjectXpGained, newDifficulty

8. UPDATE GAMES PAGE
   └─ Display new totalXP in quiz box
```

---

## 📊 Data Structure

### User Collection

```javascript
{
  _id: ObjectId,
  email: string,
  displayName: string,
  xp: number,              // Global XP
  level: number,           // Global level
  stats: {
    quizzesCompleted: number,
    averageScore: number,
    totalXP: number        // Global total
  },
  subjectScores: Map {     // ← Subject-specific data
    'math': {
      subject: 'math',
      attempts: 26,
      averageScore: 86.8,
      bestScore: 92,
      totalXP: 1543,       // ← Cumulative XP for subject
      recentScores: [90, 84, 88, 92, 85],
      currentDifficulty: 'hard',
      scoreHistory: [
        {
          score: 90,
          xpGained: 66,    // ← XP from this quiz
          date: ISODate,
          difficulty: 'hard'
        },
        // ... more history
      ]
    },
    'science': { ... }
  }
}
```

---

## 🎮 Frontend Components

### Games Page Component

```
Games.tsx
├─ useEffect
│  ├─ getAllSubjectStats()
│  └─ Build statsMap
│
├─ Render Quiz Boxes
│  └─ For each quiz:
│     ├─ Get stats from statsMap
│     ├─ Display stats:
│     │  ├─ Attempts
│     │  ├─ Best Score
│     │  └─ XP Gained (AMBER/GOLD) ✨
│     └─ Button (Play/Play Again)
│
└─ Navigation
   └─ handleStartGame(quizId)
```

### API Integration

```typescript
// client/src/api/quiz.ts

getAllSubjectStats()
  ├─ GET /quiz/all-subject-stats
  └─ Returns: { subjects: [{ totalXP, ... }] }

submitQuiz(quizId, answers)
  ├─ POST /quiz/submit
  └─ Returns: { subjectXpGained, subjectData, ... }
```

---

## 🔐 Difficulty Progression Logic

```
┌─────────────────────────────────────────────────────────┐
│         DIFFICULTY ADJUSTMENT DECISION TREE             │
└─────────────────────────────────────────────────────────┘

Current Difficulty = EASY
    ├─ Condition: Avg5 ≥ 80% AND TotalXP ≥ 500
    ├─ YES → UPGRADE to MEDIUM ✅
    │   └─ Log: "[SUBJECT] Upgraded: easy → medium"
    └─ NO → Remain EASY
        └─ Log: "[SUBJECT] Not yet qualified"

Current Difficulty = MEDIUM
    ├─ Condition 1: Avg5 ≥ 85% AND TotalXP ≥ 1500
    ├─ YES → UPGRADE to HARD ✅
    │   └─ Log: "[SUBJECT] Upgraded: medium → hard"
    │
    ├─ Condition 2: Avg5 < 60%
    ├─ YES → DOWNGRADE to EASY ⬇️
    │   └─ Log: "[SUBJECT] Downgraded: medium → easy"
    │
    └─ NO (both) → Remain MEDIUM
        └─ Continue practicing

Current Difficulty = HARD
    ├─ Condition: Avg5 < 70%
    ├─ YES → DOWNGRADE to MEDIUM ⬇️
    │   └─ Log: "[SUBJECT] Downgraded: hard → medium"
    └─ NO → Remain HARD
        └─ Continue mastery path
```

---

## 📈 XP Progression Timeline

```
Time (Days)    Quizzes    Avg Score    Total XP    Difficulty
─────────────────────────────────────────────────────────────
Day 1          3          72%          148         🟢 EASY
Day 2          5          73%          283         🟢 EASY
Day 3          7          75%          413         🟢 EASY
Day 4          10         80%          547         🟡 MEDIUM ← UPGRADED
Day 5          12         82%          665         🟡 MEDIUM
...            ...        ...          ...         ...
Day 14         25         85%          1,400       🟡 MEDIUM
Day 15         26         86%          1,543       🔴 HARD ← UPGRADED
Day 20         31         86%          1,900       🔴 HARD
Day 30         40         87%          2,450       🔴 HARD (Mastery)
```

---

## 🎯 Response Examples

### Quiz Submission Response

```javascript
{
  // Score data
  score: 80,                    // Percentage
  correct: 4,                   // Correct answers
  total: 5,                     // Total questions
  
  // XP data (ENHANCED)
  earnedXP: 40,                 // Global XP (base)
  subjectXpGained: 56,          // ✨ Subject-specific XP
  
  // User progression
  newLevel: 5,                  // Global level
  leveledUp: false,             // Level changed?
  
  // Achievement data
  achievements: [],             // New achievements
  
  // Question details
  questionsWithAnswers: [
    { _id, question, userAnswer, correctAnswer, isCorrect }
  ],
  
  // Subject-specific data (ENHANCED)
  subjectData: {
    subject: 'math',
    attempts: 26,
    averageScore: 86.8,
    bestScore: 92,
    totalXP: 1543,              // ✨ Updated cumulative XP
    currentDifficulty: 'hard'   // ✨ May be updated
  }
}
```

### Subject Stats Response

```javascript
{
  subject: 'math',
  attempts: 26,
  averageScore: 86.8,
  bestScore: 92,
  totalXP: 1543,                // ✨ Total accumulated XP
  currentDifficulty: 'hard',
  recentScores: [90, 84, 88],
  scoreHistory: [
    { score: 90, xpGained: 66, date: ISODate, difficulty: 'hard' },
    // ... more history
  ]
}
```

---

## 🗄️ Database Queries

### Get Subject XP

```javascript
// Find a user and get their subject XP
const user = await User.findById(userId);
const mathSubject = user.subjectScores.get('math');
console.log(mathSubject.totalXP);  // 1543
```

### Update Subject XP After Quiz

```javascript
// Calculate new XP
const subjectXpGained = earnedXP * (1 + score / 100 * 0.5);

// Update user document
const updateData = {
  'subjectScores.math.totalXP': subjectData.totalXP + subjectXpGained,
  'subjectScores.math.currentDifficulty': newDifficulty
};

await User.updateOne(
  { _id: userId },
  { $set: updateData }
);
```

---

## 🔄 Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 COMPLETE USER JOURNEY                        │
└─────────────────────────────────────────────────────────────┘

User Opens App
    ↓
Games Page Loads
    ├─ API: getAllSubjectStats()
    ├─ Response: { subjects: [{ totalXP: 1543, ... }] }
    └─ Display: "XP Gained: 1,543 ✨"
    ↓
User Clicks "Play Quiz"
    ↓
Quiz Page Loads
    ├─ API: getQuiz(quizId)
    └─ User sees questions with difficulty badges
    ↓
User Completes Quiz
    ↓
Submit Answers
    ├─ API: submitQuiz(quizId, answers[])
    ├─ Backend:
    │  ├─ Calculate score (80%)
    │  ├─ Calculate global XP (40)
    │  ├─ Calculate subject XP (56 = 40 × 1.4)
    │  ├─ Update user.subjectScores.math.totalXP += 56
    │  ├─ Check difficulty (now 1,543 total XP)
    │  ├─ If 1,543 ≥ 1500 AND avg ≥ 85%: Upgrade to HARD
    │  └─ Save to database
    ├─ Response: {
    │    subjectXpGained: 56,
    │    subjectData: { totalXP: 1543, difficulty: 'hard' }
    │  }
    └─ Show results with:
       ├─ Score: 80%
       ├─ XP Earned: +56
       └─ New Difficulty: HARD ✅
    ↓
Results Page
    ├─ Show "Level Up" notification if applicable
    ├─ Show difficulty change notification
    └─ Button: "Play Again" or "Back to Games"
    ↓
Back to Games Page
    ├─ Data Refreshed
    ├─ XP Updated: "XP Gained: 1,599 ✨" (1,543 + 56)
    └─ Difficulty Updated: "Level: Hard"
```

---

## 🎓 System Benefits

```
For Learners:
├─ 📊 Visible Progress: XP accumulation tracking
├─ 🎯 Clear Goals: 500 XP & 1,500 XP milestones
├─ ⚖️ Fair Progression: Both skill AND practice required
└─ 🏆 Motivation: Long-term engagement hook

For Educators:
├─ 📈 Analytics: Track student XP per subject
├─ 🔍 Insights: Identify struggling areas
└─ 🎓 Standards: Verify adequate practice

For System:
├─ 🔐 Security: Server-side calculations
├─ 💾 Persistent: All data saved
└─ ⚡ Performant: Efficient queries
```

---

## ✨ Key Takeaways

```
1. CUMULATIVE TRACKING
   └─ XP never decreases, only increases

2. SCORE BONUS SYSTEM
   └─ Better performance = more XP

3. DUAL-METRIC PROGRESSION
   └─ Prevents gaming the system

4. VISIBLE PROGRESS
   └─ Games page displays total XP

5. LONG-TERM GOALS
   └─ 1,500 XP target for Hard mode
```

---

**XP System Architecture: COMPLETE ✅**
