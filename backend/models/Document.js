const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'under-review', 'signed'],
      default: 'draft',
    },
    signatureUrl: {
      type: String,
      default: null,
    },
    metadata: {
      size: Number,
      mimetype: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);