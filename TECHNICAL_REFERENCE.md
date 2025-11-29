# Technical Reference: Quiz Scoring Implementation

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  QuizComponent                                    │   │
│  │  - Display questions                             │   │
│  │  - Submit answers via submitQuiz()               │   │
│  │  - Show currentDifficulty from response          │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↑                               │
│                    api/quiz.ts                          │
│                         ↓                               │
├─────────────────────────────────────────────────────────┤
│                    Backend (Express)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  GET /quiz/:id                                   │   │
│  │  - Fetch user's subject difficulty               │   │
│  │  - Load questions at that difficulty             │   │
│  │  - Return with currentDifficulty                 │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  POST /quiz/submit                               │   │
│  │  - Calculate score                               │   │
│  │  - Update subjectScores                          │   │
│  │  - Analyze last 5 scores                         │   │
│  │  - Adjust difficulty                             │   │
│  │  - Check achievements                            │   │
│  │  - Return all updated stats                      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  GET /subject-stats/:subject                     │   │
│  │  - Return detailed subject performance           │   │
│  │  - Include full score history                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  GET /all-subject-stats                          │   │
│  │  - Return all subjects' performance              │   │
│  │  - Quick overview (last 3 scores each)           │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↑                               │
│                  quizService.js                         │
│                  userService.js                         │
│                         ↓                               │
├─────────────────────────────────────────────────────────┤
│                    Database (MongoDB)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  User Document                                   │   │
│  │  {                                               │   │
│  │    _id: ObjectId,                               │   │
│  │    email: String,                               │   │
│  │    xp: Number,                                  │   │
│  │    level: Number,                               │   │
│  │    stats: {                                     │   │
│  │      quizzesCompleted: Number,                 │   │
│  │      averageScore: Number                      │   │
│  │    },                                           │   │
│  │    subjectScores: Map {                         │   │
│  │      "math": {                                 │   │
│  │        subject: String,                        │   │
│  │        attempts: Number,                       │   │
│  │        averageScore: Number,                   │   │
│  │        bestScore: Number,                      │   │
│  │        recentScores: [Number],                 │   │
│  │        currentDifficulty: String,              │   │
│  │        scoreHistory: [{                        │   │
│  │          score: Number,                        │   │
│  │          date: Date,                           │   │
│  │          difficulty: String                    │   │
│  │        }]                                      │   │
│  │      }                                         │   │
│  │    }                                           │   │
│  │  }                                              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Quiz Document                                  │   │
│  │  {                                              │   │
│  │    _id: ObjectId,                              │   │
│  │    title: String,                              │   │
│  │    type: String (math, science, etc),          │   │
│  │    difficulty: String,                         │   │
│  │    questions: [{                               │   │
│  │      question: String,                         │   │
│  │      options: [String],                        │   │
│  │      answer: String,                           │   │
│  │      difficulty: String                        │   │
│  │    }]                                          │   │
│  │  }                                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Data Flow: Submitting a Quiz

```
1. Frontend: submitQuiz({ quizId, answers })
   ↓
2. Backend: POST /quiz/submit
   ├─ Load Quiz by quizId
   ├─ Calculate score (correct/total * 100)
   ├─ Load User by userId
   ├─ Update global stats
   │  ├─ quizzesCompleted += 1
   │  ├─ averageScore = (old_total + new_score) / new_completed
   │  ├─ xp += (correct * 10)
   │  └─ level = recalculate()
   │
   ├─ Update subject-specific stats
   │  ├─ Get or create subjectScores[quiz.type]
   │  ├─ attempts += 1
   │  ├─ averageScore = (old_total + new_score) / new_attempts
   │  ├─ bestScore = max(bestScore, score)
   │  ├─ recentScores.push(score)
   │  │  └─ if length > 10: shift()
   │  └─ scoreHistory.push({score, date, difficulty})
   │     └─ if length > 50: shift()
   │
   ├─ Determine if difficulty should change
   │  ├─ Get last 5 scores
   │  ├─ Calculate average: last_5_avg
   │  ├─ If currentDifficulty == "easy"
   │  │  └─ if last_5_avg >= 80: upgrade to "medium"
   │  ├─ Else if currentDifficulty == "medium"
   │  │  ├─ if last_5_avg >= 85: upgrade to "hard"
   │  │  └─ if last_5_avg < 60: downgrade to "easy"
   │  └─ Else if currentDifficulty == "hard"
   │     └─ if last_5_avg < 70: downgrade to "medium"
   │
   ├─ Check achievements
   │  ├─ If score == 100: add Perfect Score achievement
   │  └─ If attempts >= 10 AND avgScore > 90: add Mastery
   │
   ├─ Save user document
   └─ Return response with subjectData
   ↓
3. Frontend: receives response with updated stats
   ├─ Display score
   ├─ Show earnedXP
   ├─ Show newLevel
   ├─ Show achievements (if any)
   └─ Show currentDifficulty (for next quiz in subject)
```

## Implementation Details

### 1. Difficulty Adjustment Algorithm

```javascript
// In POST /quiz/submit
const subject = quiz.type;
let subjectData = user.subjectScores.get(subject);

// Get last 5 scores for trend analysis
const last5Scores = subjectData.recentScores.slice(-5);
const avg5Scores = last5Scores.length > 0 
  ? last5Scores.reduce((a, b) => a + b, 0) / last5Scores.length 
  : 0;

console.log(`[${subject.toUpperCase()}] Last 5 avg score: ${avg5Scores.toFixed(2)}%`);

// Apply difficulty logic
if (subjectData.currentDifficulty === 'easy') {
  if (avg5Scores >= 80) {
    subjectData.currentDifficulty = 'medium';
    console.log(`Upgraded: easy → medium`);
  }
} else if (subjectData.currentDifficulty === 'medium') {
  if (avg5Scores >= 85) {
    subjectData.currentDifficulty = 'hard';
  } else if (avg5Scores < 60) {
    subjectData.currentDifficulty = 'easy';
  }
} else if (subjectData.currentDifficulty === 'hard') {
  if (avg5Scores < 70) {
    subjectData.currentDifficulty = 'medium';
  }
}
```

### 2. Fetching Quiz with User Difficulty

```javascript
// In GET /quiz/:id
const quiz = await Quiz.findById(req.params.id);
const user = await User.findById(req.user._id);

// Priority 1: Check saved subject difficulty
let userDifficulty = 'easy';
if (user.subjectScores && user.subjectScores.has(quiz.type)) {
  const subjectData = user.subjectScores.get(quiz.type);
  userDifficulty = subjectData.currentDifficulty;
  console.log(`Using saved difficulty: ${userDifficulty}`);
} else {
  // Priority 2: Use level-based difficulty
  const userLevel = user.level || 1;
  if (userLevel <= 3) userDifficulty = 'easy';
  else if (userLevel <= 7) userDifficulty = 'medium';
  else userDifficulty = 'hard';
  console.log(`Using level-based difficulty: ${userDifficulty}`);
}

// Pass to service
const quizWithQuestions = await quizService.getQuizById(
  req.params.id,
  { level: user.level, customDifficulty: userDifficulty },
  forceRegenerate
);
```

### 3. Average Score Calculation

```javascript
// When new score comes in:
const subject = quiz.type;
const newScore = calculatedScore; // e.g., 85
const previousAttempts = subjectData.attempts; // e.g., 4

// Calculate total score from previous attempts
const previousTotal = subjectData.averageScore * previousAttempts;

// Add new score and increment attempts
subjectData.attempts = previousAttempts + 1;
subjectData.averageScore = (previousTotal + newScore) / subjectData.attempts;

// Example:
// Before: 4 attempts, 80% avg = 320 total
// New: 85 score
// After: (320 + 85) / 5 = 405 / 5 = 81% new average
```

### 4. Achievement Unlocking

```javascript
// Mastery Achievement
if (subjectData.attempts >= 10 && subjectData.averageScore > 90) {
  const masteryAchievement = {
    title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Mastery`,
    description: `Achieved 90%+ average score in ${subject} over 10+ quizzes`,
    date: new Date()
  };
  
  const hasExisting = user.achievements.some(
    a => a.title === masteryAchievement.title
  );
  
  if (!hasExisting) {
    user.achievements.push(masteryAchievement);
  }
}
```

## Edge Cases Handled

1. **First Quiz in Subject**
   - `subjectData` not found → create new with defaults
   - `currentDifficulty` set to 'easy'

2. **First Few Quizzes (< 5)**
   - Trend analysis uses fewer than 5 scores
   - `slice(-5)` on [1, 2, 3] returns [1, 2, 3]
   - Algorithm still works with partial data

3. **Perfect Score (100%)**
   - Perfect Score achievement unlocked
   - Still subject to difficulty rules (not automatic upgrade)

4. **Zero Correct (0%)**
   - Valid submission, contributes to average
   - May trigger downgrade if trend continues

5. **Map Serialization**
   - MongoDB `Map` type converts to object in JSON
   - Frontend receives `subjectScores` as object

## Performance Optimizations

### Memory Usage
```
Per subject: ~500 bytes
- 10 fields: 200 bytes
- 10 recent scores: 100 bytes
- 50 history entries: 200 bytes

Per user (10 subjects): ~5KB
Per 1000 users: ~5MB
```

### Query Optimization
```
GET /quiz/:id:
- 1 Quiz lookup by ID: O(1) with index
- 1 User lookup by ID: O(1) with index
- Total: O(2) = O(1)

POST /quiz/submit:
- 1 Quiz lookup: O(1)
- 1 User lookup: O(1)
- 1 User update: O(1)
- Total: O(3) = O(1)
```

### Trend Analysis Speed
```
Last 5 scores analysis: O(5) = O(1)
Checking >= 10 attempts: O(1)
Checking average > 90%: O(1)
```

## Testing Checklist

- [ ] Score calculation correct
- [ ] Average formula accurate
- [ ] Difficulty upgrades at thresholds
- [ ] Difficulty downgrades when struggling
- [ ] History limited to 50 entries
- [ ] Recent scores limited to 10
- [ ] Best score updates correctly
- [ ] Mastery achievement unlocks at 10+ attempts + 90%+
- [ ] API response includes subjectData
- [ ] Subject stats endpoints work
- [ ] Multiple subjects tracked independently
- [ ] Switching subjects uses correct difficulty

## Common Queries

### Find user with highest math average
```javascript
db.users.find({
  'subjectScores.math.averageScore': { $gt: 90 }
})
```

### Find users who unlocked mastery
```javascript
db.users.find({
  'achievements.title': { $in: [
    'Math Mastery', 'Science Mastery', 'Coding Mastery'
  ]}
})
```

### Get all math scores for a user
```javascript
const user = await User.findById(userId);
const mathScores = user.subjectScores.get('math').scoreHistory;
```

## Debugging

### Check if difficulty adjusted
```javascript
console.log(`[${subject.toUpperCase()}] Last 5 avg score: ${avg5Scores.toFixed(2)}%`);
console.log(`[${subject.toUpperCase()}] Current difficulty: ${subjectData.currentDifficulty}`);
```

### Verify score in response
```javascript
res.json({
  // ... other fields
  subjectData: {
    subject,
    attempts: subjectData.attempts,
    averageScore: subjectData.averageScore,
    bestScore: subjectData.bestScore,
    currentDifficulty: subjectData.currentDifficulty
  }
});
```

### Monitor in MongoDB
```javascript
// View a user's subject scores
db.users.findOne({ _id: ObjectId("...") }, { subjectScores: 1 })
```

## Future Enhancements

1. **Time-based Analysis**
   - Track improvement over weeks/months
   - Show growth trends

2. **Difficulty Persistence**
   - Remember difficulty across sessions
   - Sync across devices

3. **Adaptive Thresholds**
   - Adjust based on overall user performance
   - Machine learning recommendations

4. **Batch Analytics**
   - Dashboard showing all subjects
   - Comparative analysis

5. **Export/Import**
   - Export performance data
   - Backup and restore

## Maintenance

### Regular Tasks
- Monitor average subject scores
- Check if mastery achievements are unlocking
- Verify difficulty adjustments happening
- Confirm history trimming working (50 entry limit)

### Migration Notes
- Existing users start with empty `subjectScores`
- First quiz in each subject gets 'easy' difficulty
- No breaking changes to existing data structure
