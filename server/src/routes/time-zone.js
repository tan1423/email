const express = require('express');
const TimeZoneController = require('../controllers/backend/TImeZoneController');
const router = express.Router();

// Routes for fetching time zone by country
router.get("/", TimeZoneController.getTimezonesByCountry)

// Routes for saving time zone
router.post("/", TimeZoneController.saveTimeZone)

module.exports = router;