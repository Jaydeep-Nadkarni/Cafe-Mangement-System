const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      enum: ['wordle', 'search', 'puzzle', 'trivia'],
      required: [true, 'Game type is required']
    },
    sessionDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null
    },
    playerInfo: {
      name: String,
      email: String,
      phone: String,
      tableNumber: Number
    },
    questionsCount: {
      type: Number,
      default: 1
    },
    currentQuestion: {
      type: Number,
      default: 1
    },
    score: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative']
    },
    totalScore: {
      type: Number,
      default: 0,
      min: [0, 'Total score cannot be negative']
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    wrongAnswers: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    rewardEarned: {
      type: Number,
      default: 0,
      min: [0, 'Reward cannot be negative']
    },
    rewardType: {
      type: String,
      enum: ['discount_coupon', 'loyalty_points', 'free_item', 'none'],
      default: 'none'
    },
    rewardValue: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    answers: {
      type: [{
        questionId: Number,
        userAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        points: Number
      }],
      default: []
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Index for frequently queried fields
gameSessionSchema.index({ gameType: 1, sessionDate: -1 });
gameSessionSchema.index({ status: 1, createdAt: -1 });
gameSessionSchema.index({ branch: 1, sessionDate: -1 });
gameSessionSchema.index({ branch: 1, sessionDate: -1, score: -1 }); // Branch engagement metrics
gameSessionSchema.index({ gameType: 1, branch: 1, sessionDate: -1 }); // Game-specific analysis
gameSessionSchema.index({ status: 1, completedAt: -1 }); // Completion analysis

module.exports = mongoose.model('GameSession', gameSessionSchema);
