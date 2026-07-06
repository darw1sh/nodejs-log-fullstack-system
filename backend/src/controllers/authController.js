const jwt = require('jsonwebtoken');
const Developer = require('../models/Developer');
const asyncHandler = require('../utils/asyncHandler');
const Joi = require('joi');
const { getJwtSecret } = require('../config/jwt');

const registerSchema = Joi.object({ username: Joi.string().min(3).required(), email: Joi.string().email().required(), password: Joi.string().min(8).required() });
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

const signToken = (developer) => jwt.sign(
  { id: developer._id, email: developer.email },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

exports.register = asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const existing = await Developer.findOne({ email: value.email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const dev = new Developer(value);
  await dev.save();

  const token = signToken(dev);
  res.status(201).json({ developer: { id: dev._id, username: dev.username, email: dev.email }, apiKey: dev.apiKey, token });
});

exports.login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const dev = await Developer.findOne({ email: value.email });
  if (!dev) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await dev.comparePassword(value.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(dev);
  res.json({ developer: { id: dev._id, username: dev.username, email: dev.email }, apiKey: dev.apiKey, token });
});

exports.logout = asyncHandler(async (req, res) => {
  // Stateless JWT: instruct client to drop token.
  res.json({ message: 'Logged out' });
});
