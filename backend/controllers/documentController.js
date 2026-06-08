const Document = require('../models/Document');
const path = require('path');

// POST /api/documents/upload
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      metadata: {
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/documents/:id
const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/documents/:id/sign
const signDocument = async (req, res) => {
  try {
    const { signatureUrl } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });

    document.signatureUrl = signatureUrl;
    document.status = 'signed';
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/documents/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });

    document.status = status;
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });

    // make sure only the uploader can delete
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // delete the actual file from disk
    const fs = require('fs');
    const filePath = `uploads/${document.filename}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = { uploadDocument, getDocuments, getDocument, signDocument, updateStatus, deleteDocument };