const express = require('express');
const creditController = require('../controllers/backend/CreditController');
const router = express.Router();

// Routes for getting credit balance
router.get('/balance', creditController.getCreditBalance);

// Routes for getting credit history
router.get('/history', creditController.creditHistory);

// Routes for adding credits
router.post('/', creditController.addCreditsToUser);

module.exports = router;