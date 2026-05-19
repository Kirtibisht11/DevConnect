import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import CreatePost from '../components/post/CreatePost';
import PostCard from '../components/post/PostCard';
import PeopleYouMayKnow from '../components/ui/PeopleYouMayKnow';
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
    <div className="min-h-screen page-shell relative">

      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-red-900/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <Navbar />

      <div className="relative pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">
          <div className="flex gap-6 justify-center">

            {/* Main Feed */}
            <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
              <div className="mb-4">
                <CreatePost onPostCreated={fetchPosts} />
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  <p className="text-gray-500 font-mono text-sm">// loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center text-gray-500 py-16 font-mono">
                  // no posts yet. be the first! 🚀
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-72 shrink-0 hidden lg:block">
              <div className="sticky top-20 space-y-4">
                <PeopleYouMayKnow />

                <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-3">// trending tags</p>
                  <div className="flex flex-wrap gap-2">
                    {['#javascript', '#python', '#react', '#nodejs', '#webdev', '#opensource'].map(tag => (
                      <span key={tag} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}