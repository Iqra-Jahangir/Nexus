import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const API_URL = 'http://localhost:5000/api';

interface Meeting {
  _id: string;
  title: string;
  host: { _id: string; name: string; email: string };
  invitee: { _id: string; name: string; email: string };
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  notes: string;
}

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // form state
  const [title, setTitle] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const token = localStorage.getItem('business_nexus_token');

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API_URL}/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      setError('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSchedule = async () => {
    setError('');
    setSuccess('');
    try {
      // first find the invitee by email
      const userRes = await fetch(`${API_URL}/users/email/${inviteeEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();

      if (!userRes.ok) throw new Error('User not found with that email');

      const res = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          invitee: userData._id,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule meeting');

      setSuccess('Meeting request sent!');
      setShowForm(false);
      setTitle(''); setInviteeEmail(''); setStartTime(''); setEndTime(''); setNotes('');
      fetchMeetings();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleStatus = async (meetingId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`${API_URL}/meetings/${meetingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchMeetings();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const myMeetings = meetings.filter(m => m.host?._id === user?.id);
  const incomingMeetings = meetings.filter(m => m.invitee?._id === user?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        <Button leftIcon={<PlusCircle size={18} />} onClick={() => setShowForm(!showForm)}>
          Schedule Meeting
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md">{success}</div>}

      {/* Schedule Meeting Form */}
      {showForm && (
        <Card>
          <CardHeader><h2 className="text-lg font-medium">New Meeting Request</h2></CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Meeting title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invitee Email</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="person@email.com"
                  value={inviteeEmail}
                  onChange={e => setInviteeEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional notes..."
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSchedule}>Send Request</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Incoming Meeting Requests */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Incoming Requests</h2>
        </CardHeader>
        <CardBody>
          {incomingMeetings.length === 0 ? (
            <p className="text-gray-500 text-sm">No incoming meeting requests</p>
          ) : (
            <div className="space-y-4">
              {incomingMeetings.map(meeting => (
                <div key={meeting._id} className="flex items-start justify-between border border-gray-200 rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{meeting.title}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User size={14} /> From: {meeting.host?.name}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} /> {formatDate(meeting.startTime)} → {formatDate(meeting.endTime)}
                    </p>
                    {meeting.notes && <p className="text-sm text-gray-500">{meeting.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {meeting.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          leftIcon={<CheckCircle size={14} />}
                          onClick={() => handleStatus(meeting._id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<XCircle size={14} />}
                          onClick={() => handleStatus(meeting._id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Badge variant={meeting.status === 'accepted' ? 'success' : 'error'}>
                        {meeting.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* My Scheduled Meetings */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">My Scheduled Meetings</h2>
        </CardHeader>
        <CardBody>
          {myMeetings.length === 0 ? (
            <p className="text-gray-500 text-sm">No meetings scheduled yet</p>
          ) : (
            <div className="space-y-4">
              {myMeetings.map(meeting => (
                <div key={meeting._id} className="flex items-start justify-between border border-gray-200 rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{meeting.title}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User size={14} /> With: {meeting.invitee?.name}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} /> {formatDate(meeting.startTime)} → {formatDate(meeting.endTime)}
                    </p>
                    {meeting.notes && <p className="text-sm text-gray-500">{meeting.notes}</p>}
                  </div>
                  <Badge variant={
                    meeting.status === 'accepted' ? 'success' :
                    meeting.status === 'rejected' ? 'error' : 'warning'
                  }>
                    {meeting.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};