const express = require('express');
const router = express.Router();
const auth = require('../routes/middleware/auth');
const quizService = require('../services/quizService');
const userService = require('../services/userService');
const { calculateLevel } = require('../utils/gameUtils');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Get all quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await quizService.getAllQuizzes();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific quiz by ID
router.get('/quiz/:id', auth.requireUser, async (req, res) => {
  try {
    // Add more detailed logging
    console.log(`Quiz request - ID: ${req.params.id}, User ID: ${req.user._id}`);
    console.log(`User object: ${JSON.stringify(req.user)}`);

    // Check if we should force regenerate questions
    const forceRegenerate = req.query.regenerate === 'true';
    console.log(`Force regenerate parameter: ${forceRegenerate}`);

    // Get the quiz to determine its type (subject)
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get user to check subject-specific difficulty
    const user = await User.findById(req.user._id);
    let userDifficulty = 'easy';

    // Check if user has previous scores in this subject
    if (user.subjectScores && user.subjectScores.has(quiz.type)) {
      const subjectData = user.subjectScores.get(quiz.type);
      userDifficulty = subjectData.currentDifficulty;
      console.log(`Using saved difficulty for ${quiz.type}: ${userDifficulty}`);
    } else {
      // Fall back to level-based difficulty
      const userLevel = user.level || 1;
      if (userLevel <= 3) {
        userDifficulty = 'easy';
      } else if (userLevel <= 7) {
        userDifficulty = 'medium';
      } else {
        userDifficulty = 'hard';
      }
      console.log(`Using level-based difficulty for ${quiz.type}: ${userDifficulty}`);
    }

    // Pass user data including difficulty to the service
    const userData = { level: user.level || 1, customDifficulty: userDifficulty };
    console.log(`Fetching quiz with difficulty: ${userDifficulty}`);

    const quizWithQuestions = await quizService.getQuizById(req.params.id, userData, forceRegenerate);
    if (!quizWithQuestions) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    console.log(`Quiz ${quizWithQuestions.title} details:`, {
      hasQuestions: !!quizWithQuestions.questions,
      questionsCount: quizWithQuestions.questions ? quizWithQuestions.questions.length : 0,
      questionsSample: quizWithQuestions.questions && quizWithQuestions.questions.length > 0 ?
        quizWithQuestions.questions[0] : 'No questions'
    });

    res.json({
      title: quizWithQuestions.title,
      questions: quizWithQuestions.questions,
      currentDifficulty: userDifficulty
    });
  } catch (error) {
    console.error(`Error fetching quiz with ID ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Submit quiz answers
router.post('/quiz/submit', auth.requireUser, async (req, res) => {
  try {
    const { quizId, answers } = req.body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid submission format' });
    }

    // Get the quiz with questions
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    console.log(`Processing quiz submission for quiz ID: ${quizId} by user ID: ${req.user._id}`);

    // Calculate score
    let correct = 0;
    const questionsWithAnswers = [];

    // Map through questions to find the corresponding answer
    quiz.questions.forEach(question => {
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      const isCorrect = userAnswer && userAnswer.answer === question.answer;

      if (isCorrect) {
        correct++;
      }

      // Add to the questions with answers array
      questionsWithAnswers.push({
        _id: question._id,
        question: question.question,
        options: question.options,
        userAnswer: userAnswer ? userAnswer.answer : null,
        correctAnswer: question.answer,
        isCorrect: isCorrect
      });
    });

    const total = quiz.questions.length;
    const score = Math.round((correct / total) * 100);

    // Get user to update stats
    const user = await User.findById(req.user._id);

    // Update user stats
    user.stats.quizzesCompleted += 1;

    // Calculate new average score
    const currentTotalScore = user.stats.averageScore * (user.stats.quizzesCompleted - 1);
    user.stats.averageScore = (currentTotalScore + score) / user.stats.quizzesCompleted;

    // Calculate XP earned (10 points per correct answer)
    const earnedXP = correct * 10;
    user.xp += earnedXP;
    user.stats.totalXP += earnedXP;

    // Calculate level based on XP
    const previousLevel = user.level;
    user.level = Math.floor(Math.log(user.xp / 100 + 1) / Math.log(1.5)) + 1;

    // Check if user leveled up
    const leveledUp = user.level > previousLevel;

    // ===== SUBJECT-SPECIFIC SCORING =====
    const subject = quiz.type;
    if (!user.subjectScores) {
      user.subjectScores = new Map();
    }

    let subjectData = user.subjectScores.get(subject);
    if (!subjectData) {
      subjectData = {
        subject,
        attempts: 0,
        averageScore: 0,
        bestScore: 0,
        recentScores: [],
        currentDifficulty: 'easy',
        scoreHistory: []
      };
    }

    // Update subject statistics
    subjectData.attempts += 1;
    
    // Update best score
    if (score > subjectData.bestScore) {
      subjectData.bestScore = score;
    }

    // Add to recent scores (keep last 10)
    subjectData.recentScores.push(score);
    if (subjectData.recentScores.length > 10) {
      subjectData.recentScores.shift();
    }

    // Calculate new average score for subject
    const previousSubjectTotal = subjectData.averageScore * (subjectData.attempts - 1);
    subjectData.averageScore = (previousSubjectTotal + score) / subjectData.attempts;

    // ===== SUBJECT-SPECIFIC XP TRACKING =====
    const subjectXpGained = Math.round(earnedXP * (1 + (score / 100) * 0.5));
    subjectData.totalXP = (subjectData.totalXP || 0) + subjectXpGained;

    // Add to score history (keep last 50)
    subjectData.scoreHistory.push({
      score,
      xpGained: subjectXpGained,
      date: new Date(),
      difficulty: quiz.difficulty
    });
    if (subjectData.scoreHistory.length > 50) {
      subjectData.scoreHistory.shift();
    }

    console.log(`[${subject.toUpperCase()}] XP Calculation: earnedXP=${earnedXP}, score=${score}, subjectXpGained=${subjectXpGained}, totalXP=${subjectData.totalXP}`);

    // ===== DIFFICULTY ADJUSTMENT LOGIC (COMBINED: SCORE + XP) =====
    // Get last 5 scores for trend analysis
    const last5Scores = subjectData.recentScores.slice(-5);
    const avg5Scores = last5Scores.length > 0 
      ? last5Scores.reduce((a, b) => a + b, 0) / last5Scores.length 
      : 0;

    // Calculate XP-based threshold
    const xpThresholds = {
      easy_to_medium: 500,    // 500 XP to reach medium
      medium_to_hard: 1000,   // 1000 XP to reach hard
      hard_to_difficult: 1500 // 1500 XP to reach difficult
    };

    console.log(`[${subject.toUpperCase()}] Last 5 avg score: ${avg5Scores.toFixed(2)}%, Total XP: ${subjectData.totalXP}, Current difficulty: ${subjectData.currentDifficulty}`);

    // Adjust difficulty based on both score performance AND XP
    if (subjectData.currentDifficulty === 'easy') {
      if (avg5Scores >= 60 && subjectData.totalXP >= xpThresholds.easy_to_medium) {
        subjectData.currentDifficulty = 'medium';
        console.log(`[${subject.toUpperCase()}] Difficulty upgraded: easy → medium (Avg: ${avg5Scores.toFixed(1)}%, XP: ${subjectData.totalXP})`);
      }
    } else if (subjectData.currentDifficulty === 'medium') {
      if (avg5Scores >= 80 && subjectData.totalXP >= xpThresholds.medium_to_hard) {
        subjectData.currentDifficulty = 'hard';
        console.log(`[${subject.toUpperCase()}] Difficulty upgraded: medium → hard (Avg: ${avg5Scores.toFixed(1)}%, XP: ${subjectData.totalXP})`);
      } else if (avg5Scores < 50) {
        subjectData.currentDifficulty = 'easy';
        console.log(`[${subject.toUpperCase()}] Difficulty downgraded: medium → easy`);
      }
    } else if (subjectData.currentDifficulty === 'hard') {
      if (avg5Scores >= 90 && subjectData.totalXP >= xpThresholds.hard_to_difficult) {
        subjectData.currentDifficulty = 'difficult';
        console.log(`[${subject.toUpperCase()}] Difficulty upgraded: hard → difficult (Avg: ${avg5Scores.toFixed(1)}%, XP: ${subjectData.totalXP})`);
      } else if (avg5Scores < 65) {
        subjectData.currentDifficulty = 'medium';
        console.log(`[${subject.toUpperCase()}] Difficulty downgraded: hard → medium`);
      }
    } else if (subjectData.currentDifficulty === 'difficult') {
      if (avg5Scores < 80) {
        subjectData.currentDifficulty = 'hard';
        console.log(`[${subject.toUpperCase()}] Difficulty downgraded: difficult → hard`);
      }
    }

    user.subjectScores.set(subject, subjectData);

    // Check for achievements
    let achievements = [];

    // Perfect score achievement
    if (score === 100) {
      const perfectScoreAchievement = {
        title: 'Perfect Score',
        description: `Scored 100% on ${quiz.title} quiz`,
        date: new Date()
      };

      // Check if the user already has this achievement
      const hasAchievement = user.achievements.some(
        a => a.title === perfectScoreAchievement.title && a.description === perfectScoreAchievement.description
      );

      if (!hasAchievement) {
        user.achievements.push(perfectScoreAchievement);
        achievements.push(perfectScoreAchievement);
      }
    }

    // Mastery achievement - average score > 90% in a subject over 10+ attempts
    if (subjectData.attempts >= 10 && subjectData.averageScore > 90) {
      const masteryAchievement = {
        title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Mastery`,
        description: `Achieved 90%+ average score in ${subject} over 10+ quizzes`,
        date: new Date()
      };

      const hasMastery = user.achievements.some(a => a.title === masteryAchievement.title);
      if (!hasMastery) {
        user.achievements.push(masteryAchievement);
        achievements.push(masteryAchievement);
      }
    }

    await user.save();

    res.json({
      score,
      correct,
      total,
      earnedXP,
      subjectXpGained,
      newLevel: user.level,
      leveledUp,
      achievements,
      questionsWithAnswers,
      // Include subject-specific data in response
      subjectData: {
        subject,
        attempts: subjectData.attempts,
        averageScore: subjectData.averageScore,
        bestScore: subjectData.bestScore,
        totalXP: subjectData.totalXP,
        currentDifficulty: subjectData.currentDifficulty
      }
    });

    console.log(`Quiz submission processed. Score: ${score}%, Global XP: ${earnedXP}, Subject XP: ${subjectXpGained}, Subject: ${subject}, Subject Total XP: ${subjectData.totalXP}, New Difficulty: ${subjectData.currentDifficulty}`);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate quiz questions
router.post('/generate', auth.requireUser, async (req, res) => {
  try {
    const { topic, quizType, difficulty, numQuestions } = req.body;

    if (!topic || !quizType || !difficulty) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const questions = await quizService.generateQuizQuestions({
      topic,
      quizType,
      difficulty,
      numQuestions
    });

    res.json({ questions });
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get subject performance data
router.get('/subject-stats/:subject', auth.requireUser, async (req, res) => {
  try {
    const { subject } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.subjectScores || !user.subjectScores.has(subject)) {
      return res.json({
        subject,
        attempts: 0,
        averageScore: 0,
        bestScore: 0,
        totalXP: 0,
        currentDifficulty: 'easy',
        recentScores: [],
        scoreHistory: []
      });
    }

    const subjectData = user.subjectScores.get(subject);
    res.json({
      subject,
      attempts: subjectData.attempts,
      averageScore: subjectData.averageScore,
      bestScore: subjectData.bestScore,
      totalXP: subjectData.totalXP || 0,
      currentDifficulty: subjectData.currentDifficulty,
      recentScores: subjectData.recentScores,
      scoreHistory: subjectData.scoreHistory
    });
  } catch (error) {
    console.error('Error fetching subject stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all subject performance data
router.get('/all-subject-stats', auth.requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.subjectScores || user.subjectScores.size === 0) {
      return res.json({
        subjects: []
      });
    }

    const subjects = [];
    user.subjectScores.forEach((subjectData, subject) => {
      subjects.push({
        subject,
        attempts: subjectData.attempts,
        averageScore: subjectData.averageScore,
        bestScore: subjectData.bestScore,
        totalXP: subjectData.totalXP || 0,
        currentDifficulty: subjectData.currentDifficulty,
        recentScores: subjectData.recentScores.slice(-3) // Last 3 scores
      });
    });

    // Sort by subject name
    subjects.sort((a, b) => a.subject.localeCompare(b.subject));

    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching all subject stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new quiz
router.post('/create', auth.requireUser, async (req, res) => {
  try {
    const { title, type, description, questions } = req.body;

    if (!title || !type || !description || !questions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quiz = await quizService.createQuiz({
      title,
      type,
      description,
      questions
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;