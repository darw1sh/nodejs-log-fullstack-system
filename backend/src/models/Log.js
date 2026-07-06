const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    message: { type: String, required: true, trim: true },
    level: { type: String, enum: ['INFO', 'WARN', 'ERROR'], required: true },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

LogSchema.index({ message: 'text' });

module.exports = mongoose.model('Log', LogSchema);
