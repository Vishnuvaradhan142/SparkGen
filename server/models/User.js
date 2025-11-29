const mongoose = require('mongoose');

const { validatePassword, isPasswordHash } = require('../utils/password.js');
const {randomUUID} = require("crypto");

// Define the achievement schema
const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    lowercase: true,
  },
  displayName: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: true,
    validate: { validator: isPasswordHash, message: 'Invalid password hash' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshToken: {
    type: String,
    unique: true,
    index: true,
    default: () => randomUUID(),
  },
  // New fields for game mechanics
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  achievements: {
    type: [achievementSchema],
    default: []
  },
  // User statistics
  stats: {
    type: {
      quizzesCompleted: {
        type: Number,
        default: 0
      },
      averageScore: {
        type: Number,
        default: 0
      },
      totalXP: {
        type: Number,
        default: 0
      }
    },
    default: {
      quizzesCompleted: 0,
      averageScore: 0,
      totalXP: 0
    }
  },
  // Subject-specific scores and difficulty tracking
  subjectScores: {
    type: Map,
    of: {
      subject: String,
      attempts: {
        type: Number,
        default: 0
      },
      averageScore: {
        type: Number,
        default: 0
      },
      bestScore: {
        type: Number,
        default: 0
      },
      totalXP: {
        type: Number,
        default: 0
      },
      recentScores: {
        type: [Number],
        default: [],
        maxlength: 10 // Keep last 10 scores for trend analysis
      },
      currentDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'difficult'],
        default: 'easy'
      },
      scoreHistory: {
        type: [{
          score: Number,
          xpGained: Number,
          date: {
            type: Date,
            default: Date.now
          },
          difficulty: String
        }],
        default: [],
        maxlength: 50 // Keep last 50 attempts
      }
    },
    default: {}
  },
  // Speed typing game statistics
  speedTypeStats: {
    type: {
      totalGames: {
        type: Number,
        default: 0
      },
      bestWPM: {
        type: Number,
        default: 0
      },
      averageWPM: {
        type: Number,
        default: 0
      },
      bestAccuracy: {
        type: Number,
        default: 0
      },
      averageAccuracy: {
        type: Number,
        default: 0
      },
      totalXPEarned: {
        type: Number,
        default: 0
      },
      gameHistory: {
        type: [{
          difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'easy'
          },
          wpm: Number,
          accuracy: Number,
          wordsCorrect: Number,
          totalWords: Number,
          earnedXP: Number,
          date: {
            type: Date,
            default: Date.now
          }
        }],
        default: [],
        maxlength: 50 // Keep last 50 games
      },
      difficulties: {
        type: {
          easy: {
            type: {
              games: {
                type: Number,
                default: 0
              },
              bestWPM: {
                type: Number,
                default: 0
              },
              averageWPM: {
                type: Number,
                default: 0
              }
            },
            default: { games: 0, bestWPM: 0, averageWPM: 0 }
          },
          medium: {
            type: {
              games: {
                type: Number,
                default: 0
              },
              bestWPM: {
                type: Number,
                default: 0
              },
              averageWPM: {
                type: Number,
                default: 0
              }
            },
            default: { games: 0, bestWPM: 0, averageWPM: 0 }
          },
          hard: {
            type: {
              games: {
                type: Number,
                default: 0
              },
              bestWPM: {
                type: Number,
                default: 0
              },
              averageWPM: {
                type: Number,
                default: 0
              }
            },
            default: { games: 0, bestWPM: 0, averageWPM: 0 }
          }
        },
        default: {
          easy: { games: 0, bestWPM: 0, averageWPM: 0 },
          medium: { games: 0, bestWPM: 0, averageWPM: 0 },
          hard: { games: 0, bestWPM: 0, averageWPM: 0 }
        }
      }
    },
    default: {
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
        hard: { games: 0, bestWPM: 0, averageWPM: 0 }
      }
    }
  }
}, {
  versionKey: false,
});

schema.set('toJSON', {
  /* eslint-disable */
  transform: (doc, ret, options) => {
    delete ret.password;
    return ret;
  },
  /* eslint-enable */
});

const User = mongoose.model('User', schema);

module.exports = User;