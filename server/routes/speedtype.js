const express = require('express');
const router = express.Router();
const auth = require('../routes/middleware/auth');
const User = require('../models/User');

// Submit speed typing game result
router.post('/submit', auth.requireUser, async (req, res) => {
  try {
    const { difficulty, wpm, accuracy, wordsCorrect, totalWords } = req.body;

    if (!difficulty || wpm === undefined || accuracy === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize speed typing stats if not exists
    if (!user.speedTypeStats) {
      user.speedTypeStats = {
        totalGames: 0,
        bestWPM: 0,
        averageWPM: 0,
        bestAccuracy: 0,
        averageAccuracy: 0,
        totalXPEarned: 0,
        gameHistory: [],
        difficulties: {
          easy: { games: 0, bestWPM: 0, averageWPM: 0 },
          medium: { games: 0, bestWPM: 0, averageWPM: 0 },
          hard: { games: 0, bestWPM: 0, averageWPM: 0 },
        },
      };
    }

    // Calculate XP earned (base on WPM and accuracy)
    const baseXP = Math.round(wpm * 5); // 5 XP per WPM
    const accuracyBonus = Math.round(baseXP * (accuracy / 100) * 0.5); // Up to 50% bonus for accuracy
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
    const earnedXP = Math.round((baseXP + accuracyBonus) * difficultyMultiplier);

    // Update user stats
    user.xp += earnedXP;
    user.stats.totalXP += earnedXP;

    // Calculate new level
    const previousLevel = user.level;
    user.level = Math.floor(Math.log(user.xp / 100 + 1) / Math.log(1.5)) + 1;
    const leveledUp = user.level > previousLevel;

    // Update speed typing specific stats
    user.speedTypeStats.totalGames += 1;
    user.speedTypeStats.totalXPEarned += earnedXP;

    // Update average WPM
    const previousWPMTotal = user.speedTypeStats.averageWPM * (user.speedTypeStats.totalGames - 1);
    user.speedTypeStats.averageWPM = Math.round((previousWPMTotal + wpm) / user.speedTypeStats.totalGames);

    // Update average accuracy
    const previousAccuracyTotal = user.speedTypeStats.averageAccuracy * (user.speedTypeStats.totalGames - 1);
    user.speedTypeStats.averageAccuracy = Math.round((previousAccuracyTotal + accuracy) / user.speedTypeStats.totalGames);

    // Update best WPM overall
    if (wpm > user.speedTypeStats.bestWPM) {
      user.speedTypeStats.bestWPM = wpm;
    }

    // Update best accuracy overall
    if (accuracy > user.speedTypeStats.bestAccuracy) {
      user.speedTypeStats.bestAccuracy = accuracy;
    }

    // Update difficulty-specific stats
    const diffStats = user.speedTypeStats.difficulties[difficulty];
    diffStats.games += 1;
    
    if (wpm > diffStats.bestWPM) {
      diffStats.bestWPM = wpm;
    }

    // Update average WPM for this difficulty
    const previousDiffWPMTotal = diffStats.averageWPM * (diffStats.games - 1);
    diffStats.averageWPM = Math.round((previousDiffWPMTotal + wpm) / diffStats.games);

    // Add to game history (keep last 50 games)
    user.speedTypeStats.gameHistory.push({
      difficulty,
      wpm,
      accuracy,
      wordsCorrect,
      totalWords,
      earnedXP,
      date: new Date(),
    });

    if (user.speedTypeStats.gameHistory.length > 50) {
      user.speedTypeStats.gameHistory.shift();
    }

    // Check for achievements
    const achievements = [];

    // Speed Demon - 100+ WPM
    if (wpm >= 100) {
      const speedDemonAchievement = {
        title: 'Speed Demon',
        description: 'Achieved 100+ WPM in speed typing',
        date: new Date(),
      };

      const hasAchievement = user.achievements.some((a) => a.title === speedDemonAchievement.title);
      if (!hasAchievement) {
        user.achievements.push(speedDemonAchievement);
        achievements.push(speedDemonAchievement);
      }
    }

    // Perfect Accuracy - 100% accuracy
    if (accuracy === 100) {
      const perfectAccuracyAchievement = {
        title: 'Perfect Accuracy',
        description: 'Achieved 100% accuracy in speed typing',
        date: new Date(),
      };

      const hasAchievement = user.achievements.some((a) => a.title === perfectAccuracyAchievement.title);
      if (!hasAchievement) {
        user.achievements.push(perfectAccuracyAchievement);
        achievements.push(perfectAccuracyAchievement);
      }
    }

    // Speedster - Win 10 games
    if (user.speedTypeStats.totalGames === 10) {
      const speedsterAchievement = {
        title: 'Speedster',
        description: 'Completed 10 speed typing games',
        date: new Date(),
      };

      const hasAchievement = user.achievements.some((a) => a.title === speedsterAchievement.title);
      if (!hasAchievement) {
        user.achievements.push(speedsterAchievement);
        achievements.push(speedsterAchievement);
      }
    }

    // Hard Mode Master - 50+ WPM on hard
    if (difficulty === 'hard' && wpm >= 50) {
      const hardMasterAchievement = {
        title: 'Hard Mode Master',
        description: 'Achieved 50+ WPM on hard difficulty',
        date: new Date(),
      };

      const hasAchievement = user.achievements.some((a) => a.title === hardMasterAchievement.title);
      if (!hasAchievement) {
        user.achievements.push(hardMasterAchievement);
        achievements.push(hardMasterAchievement);
      }
    }

    await user.save();

    res.json({
      earnedXP,
      newLevel: user.level,
      leveledUp,
      achievements,
      speedTypeStats: {
        totalGames: user.speedTypeStats.totalGames,
        bestWPM: user.speedTypeStats.bestWPM,
        averageWPM: user.speedTypeStats.averageWPM,
        bestAccuracy: user.speedTypeStats.bestAccuracy,
        averageAccuracy: user.speedTypeStats.averageAccuracy,
        totalXPEarned: user.speedTypeStats.totalXPEarned,
      },
    });

    console.log(`[Speed Type] User: ${user.username}, WPM: ${wpm}, Accuracy: ${accuracy}%, Difficulty: ${difficulty}, XP Earned: ${earnedXP}`);
  } catch (error) {
    console.error('Error submitting speed typing game:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's speed typing stats
router.get('/stats', auth.requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      speedTypeStats: user.speedTypeStats || {
        totalGames: 0,
        bestWPM: 0,
        averageWPM: 0,
        bestAccuracy: 0,
        averageAccuracy: 0,
        totalXPEarned: 0,
        difficulties: {
          easy: { games: 0, bestWPM: 0 },
          medium: { games: 0, bestWPM: 0 },
          hard: { games: 0, bestWPM: 0 },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching speed typing stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get speed typing leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { difficulty } = req.query;
    const limit = 50;

    let leaderboard;
    let query = User.find({ isActive: true });

    if (difficulty) {
      // Sort by difficulty-specific best WPM
      query = query.sort({ [`speedTypeStats.difficulties.${difficulty}.bestWPM`]: -1 });
    } else {
      // Sort by overall best WPM
      query = query.sort({ 'speedTypeStats.bestWPM': -1 });
    }

    leaderboard = await query
      .limit(limit)
      .select('displayName email level speedTypeStats')
      .lean();

    const formattedLeaderboard = leaderboard
      .filter(user => user.speedTypeStats && (user.speedTypeStats.bestWPM > 0 || user.speedTypeStats.totalGames > 0))
      .map((user, index) => ({
        id: user._id,
        rank: index + 1,
        username: user.displayName || user.email.split('@')[0],
        level: user.level,
        bestWPM: difficulty
          ? user.speedTypeStats?.difficulties?.[difficulty]?.bestWPM || 0
          : user.speedTypeStats?.bestWPM || 0,
        averageAccuracy: user.speedTypeStats?.averageAccuracy || 0,
        totalGames: difficulty
          ? user.speedTypeStats?.difficulties?.[difficulty]?.games || 0
          : user.speedTypeStats?.totalGames || 0,
      }));

    res.json({ leaderboard: formattedLeaderboard });
  } catch (error) {
    console.error('Error fetching speed typing leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
