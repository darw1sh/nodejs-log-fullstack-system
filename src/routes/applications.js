const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const apiKeyMiddleware = require('../middleware/apiKey');
const appController = require('../controllers/applicationController');
const logController = require('../controllers/logController');
const asyncHandler = require('../utils/asyncHandler');

// Dashboard routes (protected by JWT)
router.post('/', authMiddleware, appController.createApplication);
router.delete('/:name', authMiddleware, appController.deleteApplication);
router.get('/', authMiddleware, appController.getApplications);
router.get('/:name', authMiddleware, appController.getApplicationByName);

// Log ingestion (protected by API key and verifies ownership)
router.post('/:name/logs', apiKeyMiddleware, logController.ingestLog);

// Log retrieval: allow owner via JWT. We also support retrieval if apiKey provided.
const Application = require('../models/Application');

// middleware to resolve application for GET /:name/logs
const resolveApplicationForLogs = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT: authenticate and then load application owned by user
    await require('../middleware/auth')(req, res, async (err) => {
      if (err) return next(err);
      const app = await Application.findOne({ name: req.params.name.toLowerCase(), owner: req.user.id });
      if (!app) return res.status(404).json({ message: 'Application not found or not owned by you' });
      req.application = app;
      return next();
    });
  } else {
    // Try API key path
    return require('../middleware/apiKey')(req, res, next);
  }
});

router.get('/:name/logs', resolveApplicationForLogs, logController.getLogs);

module.exports = router;
