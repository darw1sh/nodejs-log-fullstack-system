const Log = require('../models/Log');
const asyncHandler = require('../utils/asyncHandler');
const Joi = require('joi');

const ingestSchema = Joi.object({ message: Joi.string().min(1).required(), level: Joi.string().valid('INFO', 'WARN', 'ERROR').required() });

exports.ingestLog = asyncHandler(async (req, res) => {
  const { error, value } = ingestSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { application } = req; // set by apiKey middleware

  const existing = await Log.findOne({ application: application._id, message: value.message, level: value.level });
  if (existing) {
    existing.count += 1;
    existing.updatedAt = new Date();
    await existing.save();
    return res.json(existing);
  }

  const log = new Log({ application: application._id, message: value.message, level: value.level });
  await log.save();
  res.status(201).json(log);
});

exports.getLogs = asyncHandler(async (req, res) => {
  const name = req.params.name;
  const { page = 1, limit = 10, level, q, sort = 'recent' } = req.query;

  const filters = { 'application': req.application ? req.application._id : undefined };
  if (level) filters.level = level;
  if (q) filters.$text = { $search: q };

  // remove undefined
  Object.keys(filters).forEach((k) => filters[k] === undefined && delete filters[k]);

  const sortBy = sort === 'count' ? { count: -1 } : { createdAt: -1 };

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  const [total, data] = await Promise.all([
    Log.countDocuments(filters),
    Log.find(filters).sort(sortBy).skip(skip).limit(parseInt(limit, 10)),
  ]);

  res.json({ total, page: parseInt(page, 10), pages: Math.ceil(total / limit), data });
});
