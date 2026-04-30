import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserPlus, Bell, Briefcase} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'like': return <Heart size={16} className="text-red-500" />;
    case 'comment': return <MessageCircle size={16} className="text-blue-500" />;
    case 'follow': return <UserPlus size={16} className="text-green-500" />;
    case 'job_follow': return <Briefcase size={16} className="text-indigo-500" />;
    case 'job_match': return <Briefcase size={16} className="text-orange-500" />;
    default: return <Bell size={16} className="text-gray-500" />;
  }
};

const getNotificationText = (n) => {
  switch (n.type) {
    case 'like': return 'liked your post';
    case 'comment': return 'commented on your post';
    case 'follow': return 'started following you';
    case 'job_follow': return `posted a new job: ${n.job_title} at ${n.job_company}`;
    case 'job_match': return `posted a job matching your skills: ${n.job_title} at ${n.job_company}`;
    default: return 'sent you a notification';
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-10">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Notifications</h1>

        {isLoading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-gray-300 text-sm mt-1">When someone likes or comments on your posts, you'll see it here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-3 transition ${
                  !n.is_read ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-200'
                }`}
              >
                {/* Sender avatar */}
                <Link to={`/profile/${n.sender_id}`}>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {n.sender_username?.[0]?.toUpperCase()}
                  </div>
                </Link>

                {/* Icon */}
                <div className="w-7 h-7 rounded-full bg-white border border-gray-100 flex items-center justify-center -ml-5 mt-5 shadow-sm">
                  {getNotificationIcon(n.type)}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <Link to={`/profile/${n.sender_id}`} className="font-semibold hover:underline">
                      {n.sender_username}
                    </Link>
                    {' '}{getNotificationText(n)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}