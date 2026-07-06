const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s]+$/, 'Application name cannot contain whitespace'],
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', ApplicationSchema);
