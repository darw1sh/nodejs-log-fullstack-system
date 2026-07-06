const Application = require('../models/Application');
const Log = require('../models/Log');
const asyncHandler = require('../utils/asyncHandler');
const Joi = require('joi');

const createSchema = Joi.object({ name: Joi.string().regex(/^[^\s]+$/).min(1).required() });

exports.createApplication = asyncHandler(async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const existing = await Application.findOne({ name: value.name.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'Application name already exists' });

  const app = new Application({ name: value.name.toLowerCase(), owner: req.user.id });
  await app.save();
  res.status(201).json(app);
});

exports.deleteApplication = asyncHandler(async (req, res) => {
  const name = req.params.name;
  const application = await Application.findOne({ name: name.toLowerCase(), owner: req.user.id });
  if (!application) return res.status(404).json({ message: 'Application not found' });

  await Log.deleteMany({ application: application._id });
  await application.remove();
  res.json({ message: 'Deleted' });
});

exports.getApplications = asyncHandler(async (req, res) => {
  const apps = await Application.find({ owner: req.user.id }).sort({ createdAt: -1 });
  res.json(apps);
});

exports.getApplicationByName = asyncHandler(async (req, res) => {
  const name = req.params.name;
  const application = await Application.findOne({ name: name.toLowerCase(), owner: req.user.id });
  if (!application) return res.status(404).json({ message: 'Application not found' });
  res.json(application);
});
