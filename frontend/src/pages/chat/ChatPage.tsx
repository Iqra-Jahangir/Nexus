import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Video, MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
  isRead?: boolean;
}

interface Conversation {
  userId: string;
  name: string;
  email: string;
  lastMessage: string;
  lastMessageTime: string;
  isRead: boolean;
  senderId: string;
}

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPartnerName, setChatPartnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const token = localStorage.getItem('business_nexus_token');

  // Socket connection
  useEffect(() => {
    if (!currentUser) return;

    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join-user-room', currentUser.id);

    socketRef.current.on('receive-message', (message: Message) => {
      if (userId && (message.senderId === userId || message.receiverId === userId)) {
        setMessages(prev => [...prev, message]);
      }
      fetchConversations();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser, userId]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      setConversations([]);
    }
  };

  // Fetch messages and partner info
  useEffect(() => {
    if (!userId || !token || !currentUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchPartner = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setChatPartnerName(data.name || 'Unknown');
        }
      } catch {
        setChatPartnerName('Unknown');
      }
    };

    fetchMessages();
    fetchPartner();
  }, [userId, token, currentUser]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !currentUser) return;

    const messageData = {
      senderId: currentUser.id,
      receiverId: userId,
      content: newMessage,
    };

    socketRef.current?.emit('send-message', messageData);

    try {
      await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId: userId, content: newMessage }),
      });
    } catch (err) {
      console.error('Failed to save message', err);
    }

    setMessages(prev => [...prev, { ...messageData, createdAt: new Date().toISOString() } as Message]);
    setNewMessage('');
    fetchConversations();
  };

  if (!currentUser) return <div className="p-8 text-center">Loading user...</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
        </div>
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No conversations yet</div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.userId}
              onClick={() => navigate(`/chat/${conv.userId}`)}
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                userId === conv.userId ? 'bg-primary-50 border-l-4 border-primary-600' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-bold">
                    {conv.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{conv.name}</p>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {userId ? (
          <>
            {/* Chat Header with Video Call Button */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-bold">
                    {chatPartnerName.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartnerName}</h2>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!currentUser?.id || !userId) return;
                  const id1 = parseInt(currentUser.id, 10);
                  const id2 = parseInt(userId, 10);
                  const roomId = `${Math.min(id1, id2)}_${Math.max(id1, id2)}`;
                  navigate(`/video/${roomId}`);
                }}
              >
                <Video size={18} />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
              {loading ? (
                <div className="text-center py-8">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <MessageCircle size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-500">No messages yet — say hello!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg._id || index}
                    className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                        msg.senderId === currentUser.id
                          ? 'bg-primary-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <MessageCircle size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-600">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};