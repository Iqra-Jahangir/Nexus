const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  getDocument,
  signDocument,
  updateStatus,
  deleteDocument,
} = require('../controllers/documentController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.get('/:id', auth, getDocument);
router.post('/:id/sign', auth, signDocument);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deleteDocument);

module.exports = router;