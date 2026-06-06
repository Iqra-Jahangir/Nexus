const express = require('express');
const router = express.Router();
const {
  createMeeting,
  getMeetings,
  updateMeetingStatus,
  getCalendarMeetings,
} = require('../controllers/meetingController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createMeeting);
router.get('/', auth, getMeetings);
router.patch('/:id/status', auth, updateMeetingStatus);
router.get('/calendar', auth, getCalendarMeetings);

module.exports = router;