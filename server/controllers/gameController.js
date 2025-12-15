const GameSession = require('../models/GameSession');
const couponService = require('../services/couponService');

// @desc    Start a new game session
// @route   POST /api/games/start
// @access  Public
const startGameSession = async (req, res) => {
  try {
    const { gameType, playerInfo } = req.body;

    const session = await GameSession.create({
      gameType,
      playerInfo,
      sessionDate: new Date(),
      status: 'in_progress'
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End a game session and claim reward
// @route   POST /api/games/:id/end
// @access  Public
const endGameSession = async (req, res) => {
  try {
    const { score } = req.body;
    const session = await GameSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({ message: 'Game session already ended' });
    }

    session.score = score;
    session.status = 'completed';
    await session.save();

    // Generate reward if eligible
    const coupon = await couponService.createGameReward(session.gameType, score);

    res.json({
      message: 'Game session ended',
      score,
      reward: coupon ? {
        code: coupon.code,
        description: coupon.description,
        discountValue: coupon.discountValue,
        discountType: coupon.discountType
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startGameSession,
  endGameSession
};
