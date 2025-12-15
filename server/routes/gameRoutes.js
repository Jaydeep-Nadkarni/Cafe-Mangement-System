const express = require('express');
const router = express.Router();
const { startGameSession, endGameSession } = require('../controllers/gameController');

router.post('/start', startGameSession);
router.post('/:id/end', endGameSession);

module.exports = router;
