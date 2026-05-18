import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function Messages() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      api.get(`/users/${userId}`).then(res => {
        const u = res.data.user;
        setSelectedUser({
          other_user_id: u.id,
          username: u.username,
          full_name: u.full_name,
          avatar_url: u.avatar_url
        });
        fetchMessages(u.id);
      });
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages');
      setConversations(res.data.conversations);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectUser = (conv) => {
    setSelectedUser(conv);
    fetchMessages(conv.other_user_id);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    setIsSending(true);
    try {
      const res = await api.post(`/messages/${selectedUser.other_user_id}`, {
        content: newMessage
      });
      setMessages(prev => [...prev, res.data.message]);
      setNewMessage('');
      fetchConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-20 px-4 pb-10">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex h-[calc(100vh-120px)]">

          {/* Conversations Sidebar */}
          <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Messages</h2>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Visit a profile and start a chat!</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {conversations.map(conv => (
                  <button
                    key={conv.other_user_id}
                    onClick={() => handleSelectUser(conv)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left border-b border-gray-50 ${
                      selectedUser?.other_user_id === conv.other_user_id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                      {conv.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {conv.full_name || conv.username}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                    </div>
                    {!conv.is_read && conv.sender_id !== user?.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          {selectedUser ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {selectedUser.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {selectedUser.full_name || selectedUser.username}
                  </p>
                  <Link
                    to={`/profile/${selectedUser.other_user_id}`}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    View profile
                  </Link>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Or start a new one from someone's profile</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}