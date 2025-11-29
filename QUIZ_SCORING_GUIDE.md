# Quick Start: Quiz Scoring & Difficulty System

## 🎯 What's New?

Your app now tracks quiz scores **per subject** and **automatically adjusts difficulty** based on how well you're doing!

## 📊 How It Works

### Before (Old System)
```
User Level 1
→ All quizzes: Easy difficulty
→ One average score for everything
```

### After (New System)
```
User takes Math quiz → Score 85%
User takes Science quiz → Score 72%
User takes Coding quiz → Score 90%

Math: 85% avg, Easy difficulty
Science: 72% avg, Easy difficulty  
Coding: 90% avg, **Upgraded to Medium!**
```

## 🚀 Difficulty Progression

### Starting Easy
```
Quiz 1: 88%
Quiz 2: 85%
Quiz 3: 82%
Quiz 4: 79%
Quiz 5: 81%
Average: 83% ✅ → UPGRADE TO MEDIUM
```

### In Medium
```
Quiz 6: 88% (Medium difficulty)
Quiz 7: 85%
Quiz 8: 89%
Quiz 9: 87%
Quiz 10: 91%
Average: 88% ✅ → UPGRADE TO HARD
```

### Struggling? Downgrade
```
Currently: Hard difficulty
Quiz 11: 65%
Quiz 12: 62%
Quiz 13: 58%
Quiz 14: 61%
Quiz 15: 59%
Average: 61% ❌ → DOWNGRADE TO MEDIUM
```

## 📈 What Gets Tracked

For each subject (math, science, coding, etc.):

| Metric | Example |
|--------|---------|
| **Attempts** | You've taken 5 math quizzes |
| **Average Score** | Your average is 84% |
| **Best Score** | Your personal best is 92% |
| **Recent Scores** | Last 3: [88%, 85%, 90%] |
| **Current Difficulty** | You're taking Medium questions |
| **Score History** | All 50 most recent attempts |

## 🏆 Achievements

### Mastery Achievement 🎖️
```
Unlocked when:
- You've attempted 10+ quizzes in a subject AND
- Your average score is 90%+

Example: Math Mastery Unlocked! 
(10+ math quizzes with 90%+ average)
```

## 💾 API Usage (For Developers)

### Get All Subject Stats
```javascript
const stats = await getAllSubjectStats();

// Returns:
{
  subjects: [
    {
      subject: "math",
      attempts: 5,
      averageScore: 84.2,
      bestScore: 92,
      currentDifficulty: "medium",
      recentScores: [88, 85, 90]
    },
    {
      subject: "science",
      attempts: 3,
      averageScore: 78.5,
      bestScore: 85,
      currentDifficulty: "easy",
      recentScores: [75, 80, 79]
    }
  ]
}
```

### Get Specific Subject Stats
```javascript
const mathStats = await getSubjectStats('math');

// Returns detailed info including full score history
```

### Submit Quiz (Now Enhanced!)
```javascript
const result = await submitQuiz({
  quizId: "quiz123",
  answers: userAnswers
});

// Response includes:
{
  score: 87,           // Your score on this quiz
  correct: 17,         // Questions you got right
  total: 20,           // Total questions
  earnedXP: 170,       // XP earned
  newLevel: 5,         // Overall level
  leveledUp: false,
  achievements: [],
  subjectData: {
    subject: "math",
    attempts: 5,
    averageScore: 84.5,
    bestScore: 92,
    currentDifficulty: "medium" // ← Updated!
  }
}
```

## 🎮 Game Flow

```
1. User starts app
   ↓
2. User selects "Math Quiz"
   ↓
3. Backend checks: 
   - Has user taken math quizzes before?
   - If YES → Use saved difficulty (e.g., Medium)
   - If NO → Use level-based difficulty (e.g., Easy)
   ↓
4. Questions load at appropriate difficulty
   ↓
5. User submits answers
   ↓
6. System calculates score
   ↓
7. Subject stats updated:
   - Attempts +1
   - Average recalculated
   - Best score updated if applicable
   - Score added to history
   ↓
8. Check last 5 scores:
   - If averaging ≥80% (Easy) → Upgrade to Medium
   - If averaging ≥85% (Medium) → Upgrade to Hard
   - If averaging <60% (Medium) → Downgrade to Easy
   - If averaging <70% (Hard) → Downgrade to Medium
   ↓
9. Next quiz in this subject will use new difficulty
```

## 📱 Frontend Display Ideas

### Subject Card
```
┌─────────────────────┐
│ 📐 Math             │
├─────────────────────┤
│ Average: 84.2%      │
│ Best: 92%           │
│ Attempts: 5         │
│ Level: Medium ▲     │
│ Recent: [88,85,90]  │
└─────────────────────┘
```

### Difficulty Indicator
```
Easy     ●●●
Medium   ●●●●●
Hard     ●●●●●●●
         Current: Medium
```

### Progress Tracker
```
Recent Performance in Math:
[88%] [85%] [90%]
↓     ↓     ↓
📈 Trend: Improving (+2% avg)
🎯 Next: Medium difficulty
```

## 🔧 Configuration

Current settings:
- Upgrade from Easy: ≥80% last 5 avg
- Upgrade from Medium: ≥85% last 5 avg
- Downgrade from Medium: <60% last 5 avg
- Downgrade from Hard: <70% last 5 avg
- Mastery Achievement: 10+ attempts, 90%+ avg
- Recent scores tracked: Last 10
- Full history tracked: Last 50

To change thresholds, edit `server/routes/quiz.js` in the "DIFFICULTY ADJUSTMENT LOGIC" section.

## ⚡ Performance Tips

- **First Quiz in Subject**: May take a moment while questions generate
- **Difficulty Changes**: Take effect immediately for next quiz
- **Score History**: Available anytime via API
- **Caching**: Last 10 scores cached for fast analysis

## 🐛 Troubleshooting

### "My difficulty didn't increase"
Check the last 5 quiz scores average:
- Easy → Medium: Need ≥80%
- Medium → Hard: Need ≥85%

If your average is just below, one more good quiz might push you over!

### "I want to reset my difficulty"
Current design doesn't support manual reset, but:
- Retake quizzes at current difficulty
- Your scores will gradually adjust the difficulty based on performance

### "Where's my score history?"
Use the API: `GET /api/quiz/all-subject-stats`
This returns all your performance data across subjects.

## 📝 Example Scenarios

### Scenario 1: New User
```
1. Takes Math quiz first time: 75%
   → Difficulty: Easy (first time default)
   → Stored: Math {attempts: 1, avg: 75%, difficulty: easy}

2. Takes Math quiz second time: 78%
   → Still Easy (needs 5 attempts to evaluate trend)
   → Stored: Math {attempts: 2, avg: 76.5%, difficulty: easy}

3-5. Takes more math quizzes...

6. After 5 quizzes with good scores:
   → Last 5 avg: 82% (≥80%)
   → **UPGRADED TO MEDIUM**
   → Next quiz will be harder
```

### Scenario 2: Overconfident User
```
1. "I'm good at Math" - Takes hard quiz immediately
   → Score: 45%
   → Penalty? No - but difficulty stays easy until proven otherwise

2. Takes easier quizzes, improves
3. Gradually works up to hard
```

### Scenario 3: Subject Expert
```
1-10. Takes 10 Science quizzes
   → Scores: [92%, 93%, 91%, 94%, 92%, 93%, 91%, 94%, 92%, 93%]
   → Average: 92.5%
   → Attempts: 10

11. After 10th attempt:
    → **ACHIEVEMENT UNLOCKED: Science Mastery! 🎖️**
    → Shows on profile
```

## 🎓 Learning Benefits

1. **Personalized Challenge**: Not too easy, not too hard
2. **Motivation**: Progress visible through difficulty levels
3. **Confidence**: Downgrade helps struggling students
4. **Achievement**: Mastery badges recognize excellence
5. **Data-Driven**: System responds to real performance

---

**Questions?** Check `SCORING_SYSTEM.md` for technical details or `IMPLEMENTATION_SUMMARY.md` for implementation info.
