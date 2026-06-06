const Meeting = require('../models/Meeting');

// POST /api/meetings — create a meeting request
const createMeeting = async (req, res) => {
  try {
    const { title, invitee, startTime, endTime, notes } = req.body;
    const host = req.user.id;

    // conflict detection — check if invitee is already booked
    const conflict = await Meeting.findOne({
      invitee,
      status: 'accepted',
      $or: [
        { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
        { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
      ],
    });

    if (conflict) {
      return res.status(409).json({ error: 'Time slot conflicts with an existing meeting' });
    }

    const meeting = new Meeting({ title, host, invitee, startTime, endTime, notes });
    await meeting.save();

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/meetings — get all meetings for logged in user
const getMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await Meeting.find({
      $or: [{ host: userId }, { invitee: userId }],
    })
      .populate('host', 'name email role')
      .populate('invitee', 'name email role')
      .sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/meetings/:id/status — accept or reject
const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // only the invitee can accept or reject
    if (meeting.invitee.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the invitee can accept or reject' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }

    meeting.status = status;
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/meetings/calendar — get meetings in a date range
const getCalendarMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const meetings = await Meeting.find({
      $or: [{ host: userId }, { invitee: userId }],
      startTime: { $gte: start, $lt: end },
      status: 'accepted',
    })
      .populate('host', 'name email')
      .populate('invitee', 'name email');

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createMeeting, getMeetings, updateMeetingStatus, getCalendarMeetings };