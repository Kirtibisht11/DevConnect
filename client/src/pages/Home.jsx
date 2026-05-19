import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import CreatePost from '../components/post/CreatePost';
import PostCard from '../components/post/PostCard';
import PeopleYouMayKnow from '../components/ui/PeopleYouMayKnow';
import { Bookmark, Briefcase, ChevronRight, Newspaper, Puzzle } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const newsTopics = ['AI', 'React', 'JavaScript', 'Postgres'];

function ConnectDots() {
  const [dots, setDots] = useState([
    { id: 1, x: 20, y: 20 },
    { id: 2, x: 80, y: 15 },
    { id: 3, x: 85, y: 75 },
    { id: 4, x: 15, y: 80 },
    { id: 5, x: 50, y: 45 },
  ]);
  const [currentDot, setCurrentDot] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const handleDotClick = (id) => {
    if (id === currentDot + 1) {
      setCurrentDot(id);
      if (id === dots.length) {
        setIsWon(true);
      }
    }
  };

  const resetGame = () => {
    setCurrentDot(0);
    setIsWon(false);
    const newDots = dots.map(d => ({
      ...d,
      x: Math.floor(Math.random() * 70) + 15,
      y: Math.floor(Math.random() * 70) + 15,
    }));
    setDots(newDots);
  };

  return (
    <div className="home-game-card bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <Puzzle size={16} className="text-red-400" />
          <p className="text-sm font-semibold text-gray-100">Connect Dots</p>
        </div>
        <button
          type="button"
          onClick={resetGame}
          className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs font-mono text-gray-300 hover:border-red-500 hover:text-red-400 transition"
        >
          Reset
        </button>
      </div>
      {isWon && (
        <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-200 font-medium">
          🎉 Winner! You connected all dots.
        </div>
      )}
      <div className="relative aspect-square w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {dots.map((dot, index) => {
            if (index < currentDot - 1) {
              const startDot = dots[index];
              const endDot = dots[index + 1];
              return (
                <line
                  key={`line-${startDot.id}`}
                  x1={`${startDot.x}%`}
                  y1={`${startDot.y}%`}
                  x2={`${endDot.x}%`}
                  y2={`${endDot.y}%`}
                  stroke="#ef4444"
                  strokeWidth="3"
                />
              );
            }
            return null;
          })}
        </svg>
        {dots.map((dot) => (
          <button
            key={dot.id}
            onClick={() => handleDotClick(dot.id)}
            style={{ left: `${dot.x}%`, top: `${dot.y}%`, transform: 'translate(-50%, -50%)' }}
            className={`absolute flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors z-10 ${
              dot.id <= currentDot
                ? 'bg-red-500 text-white'
                : 'bg-[#2a2a2a] text-gray-300 hover:bg-red-500/50'
            }`}
          >
            {dot.id}
          </button>
        ))}
      </div>
      <p className={`mt-3 text-sm font-sans ${isWon ? 'text-green-400' : 'text-gray-500'}`}>
        {isWon ? 'Great job!' : `Connect dot ${currentDot + 1}`}
      </p>
    </div>
  );
}

function HomeProfileCard({ user, postsCount }) {
  return (
    <div className="home-profile-card bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <div className="relative h-24 overflow-hidden bg-[#111111]">
        {user?.cover_url ? (
          <img src={user.cover_url} alt="cover" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/80 via-[#1a1a1a] to-red-500/20" />
        )}
        <div className="absolute inset-0 bg-black/35" />
      </div>
      <div className="-mt-8 px-4 pb-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-full border-4 border-[#111111] bg-red-500/10 flex items-center justify-center overflow-hidden text-red-400 font-bold text-xl">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            user?.username?.[0]?.toUpperCase()
          )}
        </div>
        <p className="mt-2 text-base font-semibold text-gray-100">{user?.full_name || user?.username}</p>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{user?.headline || 'Developer at DevConnect'}</p>
      </div>
      <div className="border-t border-[#2a2a2a] px-4 py-3 space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-400">
          <span>Profile views</span>
          <span className="text-red-400 font-semibold">{Math.max(postsCount * 4, 12)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-400">
          <span>Post impressions</span>
          <span className="text-red-400 font-semibold">{Math.max(postsCount * 9, 18)}</span>
        </div>
      </div>
      <div className="border-t border-[#2a2a2a] p-4">
        <Link to="/bookmarks" className="flex items-center gap-2 text-sm text-gray-300 hover:text-red-400 transition">
          <Bookmark size={15} className="text-gray-500" />
          Saved items
        </Link>
      </div>
    </div>
  );
}

function TechNewsCard() {
  const [topic, setTopic] = useState('AI');
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}%20technology&tags=story&hitsPerPage=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setStories((data.hits || []).filter(story => story.url).slice(0, 5));
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
    return () => controller.abort();
  }, [topic]);

  return (
    <div className="home-news-card bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={16} className="text-red-400" />
        <h2 className="text-lg font-semibold text-gray-100">Tech News</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {newsTopics.map(item => (
          <button
            key={item}
            onClick={() => setTopic(item)}
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              topic === item
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : 'border-[#2a2a2a] text-gray-500 hover:border-red-500/30 hover:text-red-400'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-gray-500 font-mono">// loading news...</p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-gray-500">No stories found.</p>
        ) : stories.map(story => (
          <a
            key={story.objectID}
            href={story.url}
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <p className="line-clamp-2 text-sm font-medium text-gray-200 group-hover:text-red-300">
              {story.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {story.points || 0} points - {story.author || 'unknown'}
            </p>
          </a>
        ))}
      </div>

      <a
        href={`https://news.ycombinator.com/search?q=${encodeURIComponent(topic)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-red-400"
      >
        More {topic} stories <ChevronRight size={14} />
      </a>
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
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
      <Navbar />

      <div className="relative pt-14 min-h-screen">
        <div className="mx-auto w-full max-w-[1520px] px-8 py-6 pb-10 sm:px-12 xl:px-16 2xl:px-20">
          <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(250px,320px)_minmax(540px,1.45fr)_minmax(300px,390px)]">
            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-3">
                <HomeProfileCard user={user} postsCount={posts.length} />
                <div className="home-side-card bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 space-y-4">
                  <Link to="/jobs" className="flex items-center gap-3 text-sm text-gray-300 hover:text-red-400 transition">
                    <Briefcase size={16} className="text-gray-500" />
                    Job tracker
                  </Link>
                  <Link to="/bookmarks" className="flex items-center gap-3 text-sm text-gray-300 hover:text-red-400 transition">
                    <Bookmark size={16} className="text-gray-500" />
                    Saved posts
                  </Link>
                </div>
              </div>
            </aside>

            <main className="min-w-0">
              <div className="mb-4">
                <CreatePost onPostCreated={fetchPosts} />
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#2a2a2a]" />
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition">
                  Sort by: <span className="text-gray-300">Top</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  <p className="text-gray-500 font-mono text-sm">// loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center text-gray-500 py-16 font-mono">
                  // no posts yet. be the first!
                </div>
              ) : (
                <div className="feed-stack">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                  ))}
                </div>
              )}
            </main>

            <aside className="hidden xl:block">
              <div className="sticky top-20 space-y-3">
                <TechNewsCard />
                <ConnectDots />
                <PeopleYouMayKnow />

                <div className="home-tags-card bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
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
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
