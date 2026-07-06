const Developer = require('../models/Developer');
const Application = require('../models/Application');

// Validates x-api-key header and ensures the key belongs to the owner of :name application
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const appName = req.params.name;

    if (!apiKey) return res.status(401).json({ message: 'Missing API key' });
    if (!appName) return res.status(400).json({ message: 'Application name required in URL' });

    const developer = await Developer.findOne({ apiKey }).select('-password');
    if (!developer) return res.status(401).json({ message: 'Invalid API key' });

    const application = await Application.findOne({ name: appName.toLowerCase() });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (!application.owner.equals(developer._id)) {
      return res.status(403).json({ message: 'API key does not belong to the application owner' });
    }

    req.developer = developer;
    req.application = application;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = apiKeyMiddleware;
