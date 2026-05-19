import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserPlus, Bell, Briefcase, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'like': return <Heart size={13} className="text-red-500" />;
    case 'comment': return <MessageCircle size={13} className="text-blue-400" />;
    case 'follow': return <UserPlus size={13} className="text-green-400" />;
    case 'job_follow': return <Briefcase size={13} className="text-red-400" />;
    case 'job_match': return <Briefcase size={13} className="text-orange-400" />;
    case 'job_apply': return <Briefcase size={13} className="text-teal-400" />;
    default: return <Bell size={13} className="text-gray-500" />;
  }
};

const getNotificationText = (n) => {
  switch (n.type) {
    case 'like': return 'liked your post';
    case 'comment': return 'commented on your post';
    case 'follow': return 'started following you';
    case 'job_follow': return `posted a new job: ${n.job_title} at ${n.job_company}`;
    case 'job_match': return `posted a job matching your skills: ${n.job_title} at ${n.job_company}`;
    case 'job_apply': return `applied to your job: ${n.job_title} at ${n.job_company}`;
    default: return 'sent you a notification';
  }
};

const NotificationAvatar = ({ notification }) => (
  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shrink-0 overflow-hidden">
    {notification.sender_avatar ? (
      <img src={notification.sender_avatar} alt="" className="w-full h-full object-cover" />
    ) : (
      notification.sender_username?.[0]?.toUpperCase()
    )}
  </div>
);

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const publishUnreadCount = (nextNotifications) => {
    const nextUnreadCount = nextNotifications.filter(n => !n.is_read).length;
    window.dispatchEvent(new CustomEvent('notifications:unread-count', {
      detail: { count: nextUnreadCount },
    }));
  };

  const getNotificationTarget = (notification) => {
    if (['like', 'comment'].includes(notification.type) && notification.entity_id) {
      return `/posts/${notification.entity_id}`;
    }

    if (['job_follow', 'job_match', 'job_apply'].includes(notification.type) && notification.entity_id) {
      return `/jobs/${notification.entity_id}`;
    }

    return `/profile/${notification.sender_id}`;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const nextNotifications = res.data.notifications;

        setNotifications(nextNotifications);
        publishUnreadCount(nextNotifications);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new CustomEvent('notifications:unread-count', {
        detail: { count: 0 },
      }));
    } catch (err) { console.error(err); }
  };

  const markOneRead = async (notification) => {
    if (notification.is_read) return;

    try {
      const res = await api.put(`/notifications/${notification.id}/read`);
      const nextNotifications = notifications.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      );

      setNotifications(nextNotifications);
      window.dispatchEvent(new CustomEvent('notifications:unread-count', {
        detail: { count: res.data.count ?? nextNotifications.filter(n => !n.is_read).length },
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const openNotification = async (notification) => {
    await markOneRead(notification);
    navigate(getNotificationTarget(notification));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 font-mono">// notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-0.5 font-mono">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition font-mono border border-[#2a2a2a] hover:border-red-500/30 px-3 py-2 rounded-lg"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-24">
                <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                <p className="text-gray-500 font-mono text-sm">// loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                  <Bell size={28} className="text-gray-700" />
                </div>
                <p className="text-gray-500 font-mono">// no notifications yet</p>
                <p className="text-gray-600 text-sm">When someone likes or comments on your posts, you'll see it here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNotification(n)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openNotification(n);
                      }
                    }}
                    className={`w-full bg-[#111111] rounded-xl border p-4 flex items-center gap-3 text-left transition hover:border-red-500/30 hover:bg-[#151515] ${
                      !n.is_read ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-[#2a2a2a]'
                    }`}
                  >
                    <NotificationAvatar notification={n} />
                    <div className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center -ml-5 mt-5 shadow-sm shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-gray-100">
                          {n.sender_username}
                        </span>
                        {' '}{getNotificationText(n)}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markOneRead(n);
                          }}
                          className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-mono text-red-300 hover:bg-red-500/20"
                        >
                          Mark seen
                        </button>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
