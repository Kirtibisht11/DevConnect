import { useEffect, useState } from 'react';
import { Users, FileText, Heart, MessageCircle, Briefcase, MessageSquare, Trash2, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-[#111111] rounded-xl border border-[#2a2a2a] p-5 flex items-center gap-4 hover:border-red-500/20 transition">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 font-mono">{label}</p>
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

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
      setRecentUsers(res.data.recentUsers);
      setRecentPosts(res.data.recentPosts);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setRecentUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setRecentPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Shield size={18} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100 font-mono">// admin_dashboard</h1>
              <p className="text-sm text-gray-500 font-mono mt-0.5">Manage DevConnect platform</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <p className="text-gray-500 font-mono text-sm">// loading stats...</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard icon={Users} label="users" value={stats.users} color="bg-indigo-500" />
                <StatCard icon={FileText} label="posts" value={stats.posts} color="bg-purple-500" />
                <StatCard icon={MessageCircle} label="comments" value={stats.comments} color="bg-blue-500" />
                <StatCard icon={Heart} label="likes" value={stats.likes} color="bg-red-500" />
                <StatCard icon={Briefcase} label="jobs" value={stats.jobs} color="bg-green-500" />
                <StatCard icon={MessageSquare} label="messages" value={stats.messages} color="bg-orange-500" />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-mono transition border ${activeTab === 'overview' ? 'bg-red-500 text-white border-red-500' : 'bg-[#111111] border-[#2a2a2a] text-gray-400 hover:border-red-500/30'}`}
                >
                  Recent Users
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`px-4 py-2 rounded-lg text-sm font-mono transition border ${activeTab === 'posts' ? 'bg-red-500 text-white border-red-500' : 'bg-[#111111] border-[#2a2a2a] text-gray-400 hover:border-red-500/30'}`}
                >
                  Recent Posts
                </button>
              </div>

              {/* Recent Users */}
              {activeTab === 'overview' && (
                <div className="bg-[#111111] rounded-xl border border-[#2a2a2a] overflow-hidden">
                  <div className="p-4 border-b border-[#2a2a2a]">
                    <h2 className="font-semibold text-gray-100 font-mono text-sm">// recent_users</h2>
                  </div>
                  <div className="divide-y divide-[#1a1a1a]">
                    {recentUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-[#1a1a1a] transition">
                        <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-200">
                            {u.full_name || u.username}
                            {u.role === 'admin' && (
                              <span className="ml-2 text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">Admin</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                        <p className="text-xs text-gray-600 shrink-0">
                          {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                        </p>
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDeleteUser(u.id)} className="text-gray-600 hover:text-red-400 transition shrink-0">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Posts */}
              {activeTab === 'posts' && (
                <div className="bg-[#111111] rounded-xl border border-[#2a2a2a] overflow-hidden">
                  <div className="p-4 border-b border-[#2a2a2a]">
                    <h2 className="font-semibold text-gray-100 font-mono text-sm">// recent_posts</h2>
                  </div>
                  <div className="divide-y divide-[#1a1a1a]">
                    {recentPosts.map(post => (
                      <div key={post.id} className="flex items-start gap-4 p-4 hover:bg-[#1a1a1a] transition">
                        <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                          {post.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-200">{post.full_name || post.username}</p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{post.content}</p>
                          <p className="text-xs text-gray-600 mt-1">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                        </div>
                        <button onClick={() => handleDeletePost(post.id)} className="text-gray-600 hover:text-red-400 transition shrink-0">
                          <Trash2 size={15} />
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
    </div>
  );
}