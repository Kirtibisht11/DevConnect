import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, CheckCheck, FileText, Image, Paperclip, Send, MessageSquare, X } from 'lucide-react';
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
  const [attachment, setAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageAttachment = (item) => item?.attachment_type?.startsWith('image/');

  const renderAvatar = (person, sizeClass = 'w-10 h-10') => (
    <div className={`${sizeClass} rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shrink-0 overflow-hidden`}>
      {person?.avatar_url ? (
        <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        person?.username?.[0]?.toUpperCase()
      )}
    </div>
  );

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      api.get(`/users/${userId}`).then(res => {
        const u = res.data.user;
        setSelectedUser({ other_user_id: u.id, username: u.username, full_name: u.full_name, avatar_url: u.avatar_url });
        fetchMessages(u.id);
      });
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages');
      const nextConversations = res.data.conversations;
      const nextUnreadCount = nextConversations.reduce((total, conv) => total + Number(conv.unread_count || 0), 0);

      setConversations(nextConversations);
      window.dispatchEvent(new CustomEvent('messages:unread-count', {
        detail: { count: nextUnreadCount },
      }));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data.messages);
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  const handleSelectUser = (conv) => {
    setSelectedUser(conv);
    fetchMessages(conv.other_user_id);
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachment) || !selectedUser) return;
    setIsSending(true);
    try {
      let attachmentPayload = {};

      if (attachment) {
        const formData = new FormData();
        formData.append('attachment', attachment);

        const uploadRes = await api.post('/upload/message-attachment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        attachmentPayload = {
          attachment_url: uploadRes.data.attachment_url,
          attachment_type: uploadRes.data.attachment_type,
          attachment_name: uploadRes.data.attachment_name,
          attachment_size: uploadRes.data.attachment_size,
        };
      }

      const res = await api.post(`/messages/${selectedUser.other_user_id}`, {
        content: newMessage,
        ...attachmentPayload,
      });

      setMessages(prev => [...prev, res.data.message]);
      setNewMessage('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchConversations();
    } catch (err) { console.error(err); }
    finally { setIsSending(false); }
  };

  return (
    // Full viewport, offset by navbar height (56px = h-14)
    <div className="h-screen page-shell flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-14">
        <div className="messages-page-box flex flex-1 max-w-screen-xl w-full mx-auto px-4 pb-4 gap-4 page-box">
          <div className="chat-shell flex flex-1 bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">

            {/* Sidebar */}
            <div className="w-72 border-r border-[#2a2a2a] flex flex-col shrink-0">
              <div className="page-hero-compact p-4 border-b border-[#2a2a2a]">
                <h2 className="font-semibold text-gray-100 font-mono text-sm">// messages</h2>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                  <MessageSquare size={32} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                  <p className="text-xs mt-1 text-gray-600">Visit a profile and start a chat!</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  {conversations.map(conv => (
                    <button key={conv.other_user_id} onClick={() => handleSelectUser(conv)}
                      className={`w-full flex items-center gap-3 p-4 transition text-left border-b border-[#1a1a1a] ${
                        selectedUser?.other_user_id === conv.other_user_id ? 'border-l-2 border-l-red-500' : ''
                      }`}
                    >
                      {renderAvatar(conv)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{conv.full_name || conv.username}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {conv.last_message || (conv.last_attachment_name ? `Attachment: ${conv.last_attachment_name}` : '')}
                        </p>
                      </div>
                      {Number(conv.unread_count || 0) > 0 && (
                        <div className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center shrink-0 shadow-sm shadow-red-950/50">
                          {Number(conv.unread_count) > 99 ? '99+' : conv.unread_count}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat area */}
            {selectedUser ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3 shrink-0">
                  {renderAvatar(selectedUser, 'w-9 h-9')}
                  <div>
                    <p className="font-semibold text-sm text-gray-100">{selectedUser.full_name || selectedUser.username}</p>
                    <Link to={`/profile/${selectedUser.other_user_id}`} className="text-xs text-red-400 hover:underline font-mono">
                      view profile →
                    </Link>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`message-bubble rounded-2xl text-sm ${
                          isMe ? 'message-bubble-own bg-red-500 text-white rounded-br-sm' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 rounded-bl-sm'
                        }`}>
                          {msg.content && <p>{msg.content}</p>}
                          {msg.attachment_url && (
                            <div className={`${msg.content ? 'mt-2' : ''}`}>
                              {isImageAttachment(msg) ? (
                                <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/20">
                                  <img src={msg.attachment_url} alt={msg.attachment_name || 'Attachment'} className="max-h-64 w-full object-cover" />
                                </a>
                              ) : (
                                <a
                                  href={msg.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 rounded-xl border p-3 transition ${
                                    isMe ? 'border-white/20 bg-white/10 hover:bg-white/15' : 'border-[#2a2a2a] bg-[#111111] hover:bg-[#151515]'
                                  }`}
                                >
                                  <FileText size={18} className="shrink-0" />
                                  <span className="min-w-0">
                                    <span className="block truncate text-xs font-medium">{msg.attachment_name || 'Attachment'}</span>
                                    <span className={`block text-[11px] ${isMe ? 'text-red-100/70' : 'text-gray-500'}`}>
                                      {formatFileSize(msg.attachment_size)}
                                    </span>
                                  </span>
                                </a>
                              )}
                            </div>
                          )}
                          <p className={`flex flex-wrap items-center gap-1 text-xs mt-1 ${isMe ? 'justify-end text-white/80' : 'text-gray-500'}`}>
                            <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                            {isMe && (
                              <span className="inline-flex items-center gap-0.5" title={msg.is_read ? 'Seen' : 'Sent'}>
                                {msg.is_read ? <CheckCheck size={13} /> : <Check size={13} />}
                                <span>{msg.is_read ? 'Seen' : 'Sent'}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-[#2a2a2a] shrink-0">
                  {attachment && (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-gray-300">
                        {attachment.type.startsWith('image/') ? <Image size={16} className="text-red-400 shrink-0" /> : <FileText size={16} className="text-red-400 shrink-0" />}
                        <span className="truncate">{attachment.name}</span>
                        <span className="shrink-0 text-xs text-gray-600">{formatFileSize(attachment.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachment(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="rounded-full p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending}
                      className="border border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 p-2.5 rounded-full hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-40"
                      title="Attach file"
                    >
                      <Paperclip size={16} />
                    </button>
                    <input
                      type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 border border-[#2a2a2a] bg-[#1a1a1a] text-gray-200 placeholder-gray-600 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/30"
                    />
                    <button onClick={handleSend} disabled={(!newMessage.trim() && !attachment) || isSending}
                      className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition disabled:opacity-40">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#061434] via-[#0f2f69] to-[#123f8f]">
                <div className="text-center text-white">
                  <MessageSquare size={48} className="mx-auto mb-4 text-white" />
                  <p className="font-semibold text-white font-mono">// select a conversation</p>
                  <p className="text-sm mt-1 text-blue-100">or start from someone's profile</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
