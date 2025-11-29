# Quiz Scoring & Adaptive Difficulty System

## Overview

The app now features a comprehensive scoring system that tracks quiz performance by subject and automatically adjusts quiz difficulty based on user performance.

## Features

### 1. Subject-Specific Score Tracking

Each user has a score history for every quiz subject (math, science, coding, etc.). The system tracks:

- **Attempts**: Total number of quizzes completed in that subject
- **Average Score**: Running average of all quiz scores for the subject
- **Best Score**: Highest score achieved in that subject
- **Recent Scores**: Last 10 quiz scores (used for trend analysis)
- **Score History**: Last 50 quiz attempts with timestamp and difficulty
- **Current Difficulty**: The adaptive difficulty level for the subject

### 2. Automatic Difficulty Adjustment

The system uses a performance-based algorithm to automatically adjust difficulty:

#### Easy Level
- **Upgrade to Medium**: When average of last 5 scores ≥ 80%
- Current when first starting a subject

#### Medium Level
- **Upgrade to Hard**: When average of last 5 scores ≥ 85%
- **Downgrade to Easy**: When average of last 5 scores < 60%

#### Hard Level
- **Downgrade to Medium**: When average of last 5 scores < 70%
- Most challenging questions

### 3. Quiz Submission Response

When a user submits a quiz, the response includes:

```json
{
  "score": 85,                    // Percentage score (0-100)
  "correct": 17,                  // Number of correct answers
  "total": 20,                    // Total questions
  "earnedXP": 170,               // XP gained (10 per correct answer)
  "newLevel": 5,                 // Updated overall level
  "leveledUp": false,            // Whether user leveled up
  "achievements": [],            // New achievements unlocked
  "questionsWithAnswers": [...],
  "subjectData": {
    "subject": "math",
    "attempts": 3,
    "averageScore": 82.33,
    "bestScore": 90,
    "currentDifficulty": "medium"  // Updated difficulty
  }
}
```

### 4. Performance Metrics

The system automatically calculates:

- **Per-Subject Average**: Average score across all attempts in a subject
- **Trend Analysis**: Examines last 5 scores to determine if user is improving or struggling
- **Best Performance**: Tracks highest score ever achieved
- **Improvement Tracking**: Historical score data allows users to see progress over time

### 5. Achievements

New achievement unlocked:

- **Subject Mastery**: When a user achieves:
  - 10+ quiz attempts in a subject
  - Average score > 90%

## API Endpoints

### Get Quiz (with adaptive difficulty)
```
GET /api/quiz/quiz/:id
```
- Returns quiz with questions at the user's current subject difficulty
- If user has taken the subject before, uses saved difficulty
- Otherwise uses level-based default difficulty

**Response includes:**
```json
{
  "title": "Math Quiz",
  "questions": [...],
  "currentDifficulty": "medium"  // User's current difficulty for this subject
}
```

### Submit Quiz Answers
```
POST /api/quiz/quiz/submit
Body: { quizId: string, answers: Array<{ questionId: string, answer: string }> }
```
- Calculates score and updates all statistics
- Determines if difficulty should be adjusted
- Returns subject-specific data
- Checks for new achievements

### Get Subject Stats
```
GET /api/quiz/subject-stats/:subject
```
- Returns detailed performance data for a specific subject
- Includes full score history

**Response:**
```json
{
  "subject": "math",
  "attempts": 5,
  "averageScore": 84.2,
  "bestScore": 95,
  "currentDifficulty": "medium",
  "recentScores": [85, 80, 88, 82, 86],
  "scoreHistory": [...]  // Last 50 attempts
}
```

### Get All Subject Stats
```
GET /api/quiz/all-subject-stats
```
- Returns performance summary for all subjects user has taken quizzes in
- Includes only last 3 scores per subject for quick overview

**Response:**
```json
{
  "subjects": [
    {
      "subject": "math",
      "attempts": 5,
      "averageScore": 84.2,
      "bestScore": 95,
      "currentDifficulty": "medium",
      "recentScores": [88, 82, 86]
    },
    {
      "subject": "science",
      "attempts": 3,
      "averageScore": 78.5,
      "bestScore": 85,
      "currentDifficulty": "easy",
      "recentScores": [75, 80, 79]
    }
  ]
}
```

## Database Schema

### User.subjectScores (Map)
```javascript
{
  "math": {                    // Subject key
    subject: "math",
    attempts: 5,
    averageScore: 84.2,
    bestScore: 95,
    recentScores: [85, 80, 88, 82, 86],  // Last 10
    currentDifficulty: "medium",
    scoreHistory: [
      {
        score: 85,
        date: "2024-11-27T10:30:00Z",
        difficulty: "medium"
      },
      // ... last 50 attempts
    ]
  },
  "science": { /* ... */ },
  "coding": { /* ... */ }
}
```

## Frontend Integration Example

```typescript
import { submitQuiz, getAllSubjectStats } from './api/quiz';

// After user submits quiz
const result = await submitQuiz({
  quizId: quizId,
  answers: userAnswers
});

console.log(`Score: ${result.score}%`);
console.log(`New difficulty: ${result.subjectData.currentDifficulty}`);

// Get all subject performance
const stats = await getAllSubjectStats();
stats.subjects.forEach(subject => {
  console.log(`${subject.subject}: ${subject.averageScore.toFixed(1)}% avg`);
});
```

## Behavior Examples

### Example 1: Struggling Student
- User starts with **Easy** difficulty
- Takes 5 Math quizzes: 70%, 65%, 72%, 68%, 75% (avg: 70%)
- **Stays at Easy** (needs ≥80% for upgrade)
- System provides targeted support

### Example 2: Advanced Student
- User starts with **Easy** difficulty
- Takes Math quizzes and scores well: 90%, 88%, 92%, 89%, 91% (avg: 90%)
- Upgrades to **Medium** (≥80% threshold)
- Continues scoring: 87%, 85%, 88%, 86%, 89% (avg: 87%)
- Upgrades to **Hard** (≥85% threshold)
- More challenging questions provided

### Example 3: Difficulty Drop
- User is at **Hard** difficulty
- Recent performance drops: 65%, 62%, 58%, 61%, 64% (avg: 62%)
- Downgrades to **Medium** (below 70% threshold)
- Back to manageable difficulty

## Implementation Details

### Difficulty Determination Priority
1. If user has completed quizzes in this subject → use saved difficulty
2. Otherwise → use level-based difficulty (easy ≤3, medium 3-7, hard >7)

### Score Calculation
- Points per correct answer: 10 XP
- Score percentage: (correct answers / total questions) × 100
- Level calculation: Uses logarithmic formula (consistent with overall level)

### Performance Considerations
- Recent scores cached (last 10 kept in memory)
- Full history stored but limited to 50 entries per subject
- MongoDB Map structure for efficient subject lookups
- Trend analysis only looks at last 5 scores for speed

## Future Enhancements

Potential improvements:
- Learning analytics dashboard
- Predicted difficulty based on ML
- Peer comparison leaderboards by subject
- Personalized study recommendations
- Subject-specific achievements (e.g., "Math Wizard")
- Streak tracking (consecutive high scores)
- Time-based performance analysis
