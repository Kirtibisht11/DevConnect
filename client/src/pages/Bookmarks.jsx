import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PostCard from '../components/post/PostCard';
import api from '../api/axios';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data.bookmarks);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchBookmarks(); }, []);

  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Bookmark size={16} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100 font-mono">// saved_posts</h1>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{bookmarks.length} saved</p>
            </div>
          </div>

          <div className="max-w-2xl">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-24">
                <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                <p className="text-gray-500 font-mono text-sm">// loading...</p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                  <Bookmark size={28} className="text-gray-700" />
                </div>
                <p className="text-gray-500 font-mono">// no saved posts yet</p>
                <p className="text-gray-600 text-sm">Click the bookmark icon on any post to save it here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookmarks.map(post => <PostCard key={post.id} post={post} onUpdate={fetchBookmarks} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}