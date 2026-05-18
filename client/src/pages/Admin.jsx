import { useEffect, useState } from 'react';
import { Users, FileText, Heart, MessageCircle, Briefcase, MessageSquare, Trash2, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  </div>
);

export default function Admin() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  if (user?.role !== 'admin') return <Navigate to="/" />;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
      setRecentUsers(res.data.recentUsers);
      setRecentPosts(res.data.recentPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setRecentUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setRecentPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-20 px-4 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Manage DevConnect platform</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-20">Loading stats...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard icon={Users} label="Users" value={stats.users} color="bg-indigo-500" />
              <StatCard icon={FileText} label="Posts" value={stats.posts} color="bg-purple-500" />
              <StatCard icon={MessageCircle} label="Comments" value={stats.comments} color="bg-blue-500" />
              <StatCard icon={Heart} label="Likes" value={stats.likes} color="bg-red-500" />
              <StatCard icon={Briefcase} label="Jobs" value={stats.jobs} color="bg-green-500" />
              <StatCard icon={MessageSquare} label="Messages" value={stats.messages} color="bg-orange-500" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Recent Users
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'posts' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Recent Posts
              </button>
            </div>

            {/* Recent Users */}
            {activeTab === 'overview' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Recent Users</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {u.full_name || u.username}
                          {u.role === 'admin' && (
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">
                        {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                      </p>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-gray-300 hover:text-red-500 transition shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts */}
            {activeTab === 'posts' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Recent Posts</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentPosts.map(post => (
                    <div key={post.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        {post.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{post.full_name || post.username}</p>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{post.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-300 hover:text-red-500 transition shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}