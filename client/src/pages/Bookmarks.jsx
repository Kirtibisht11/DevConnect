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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <Bookmark size={20} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">Saved Posts</h1>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No saved posts yet</p>
            <p className="text-gray-300 text-sm mt-1">Click the bookmark icon on any post to save it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map(post => (
              <PostCard key={post.id} post={post} onUpdate={fetchBookmarks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}