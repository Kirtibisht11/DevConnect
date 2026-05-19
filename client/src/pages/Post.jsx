import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PostCard from '../components/post/PostCard';
import api from '../api/axios';

export default function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPost = async () => {
    try {
      setError('');
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.post);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not load post');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-3xl mx-auto px-4 py-6 pb-10">
          <Link
            to="/notifications"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition font-mono mb-4"
          >
            <ArrowLeft size={14} />
            Back to alerts
          </Link>

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <p className="text-gray-500 font-mono text-sm">// loading post...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <MessageSquare size={28} className="text-gray-700" />
              </div>
              <p className="text-gray-500 font-mono">// {error}</p>
            </div>
          ) : (
            <PostCard post={post} onUpdate={fetchPost} />
          )}
        </div>
      </div>
    </div>
  );
}
