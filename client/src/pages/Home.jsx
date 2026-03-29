import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import CreatePost from '../components/post/CreatePost';
import PostCard from '../components/post/PostCard';
import api from '../api/axios';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts/explore');
      setPosts(res.data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-10">

        {/* Create Post */}
        <div className="mb-4">
          <CreatePost onPostCreated={fetchPosts} />
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No posts yet. Be the first to post! 🚀
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}