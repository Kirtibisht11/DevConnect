import { useState } from 'react';
import { Search as SearchIcon, MapPin, Briefcase, User, FileText, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';

export default function Search() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('users');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}&type=${type}`);
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setResults([]);
    setSearched(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const tabs = [
    { key: 'users', label: 'People', icon: User },
    { key: 'posts', label: 'Posts', icon: FileText },
  ];

  return (
    <div className="min-h-screen page-shell">
      <Navbar />

      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-8">

          {/* Page Header */}
          <div className="page-hero mb-6">
            <h1 className="text-2xl font-bold text-gray-100 font-mono">// search</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">find developers, posts, and more</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-3 items-center">
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-3 bg-[#111111] border border-[#2a2a2a] rounded-xl px-4 py-3 focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/20 transition">
                <SearchIcon size={18} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search developers, posts, skills..."
                  autoFocus
                  className="flex-1 text-sm text-gray-200 placeholder-gray-600 outline-none bg-transparent font-mono"
                />
                {query && (
                  <button type="button" onClick={clearSearch} className="text-gray-600 hover:text-gray-400 transition">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-mono font-medium transition whitespace-nowrap"
              >
                {isLoading ? '// searching...' : '$ search'}
              </button>
            </div>
          </form>

          {/* Type Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition border ${
                  type === key
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-[#111111] border-[#2a2a2a] text-gray-400 hover:border-red-500/30 hover:text-gray-300'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <p className="text-gray-500 font-mono text-sm">// searching...</p>
            </div>
          ) : searched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <SearchIcon size={48} className="text-gray-700" />
              <p className="text-gray-500 font-mono">// no results for "{query}"</p>
              <p className="text-gray-600 text-sm">Try different keywords or switch to another tab</p>
            </div>
          ) : !searched ? (
            /* Empty state - prompt */
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <SearchIcon size={28} className="text-red-500/60" />
              </div>
              <div>
                <p className="text-gray-400 font-mono text-lg">// start searching</p>
                <p className="text-gray-600 text-sm mt-1">Find developers by name, username, or skill</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['javascript', 'python', 'react', 'node.js', 'rust'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setQuery(tag); }}
                    className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full font-mono hover:bg-red-500/20 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {type === 'users' && results.map(user => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-red-500/30 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-lg shrink-0 group-hover:border-red-500/60 transition">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-100 group-hover:text-red-400 transition truncate">
                          {user.full_name || user.username}
                        </p>
                        {user.open_to_work && (
                          <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-500/20 shrink-0">
                            <Briefcase size={10} /> Hiring
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-mono">@{user.username}</p>
                      {user.headline && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{user.headline}</p>
                      )}
                      {user.location && (
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin size={10} /> {user.location}
                        </p>
                      )}
                      {user.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/20">
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="text-xs text-gray-600">+{user.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {type === 'posts' && results.map(post => (
                <div key={post.id} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-red-500/30 transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                      {post.avatar_url ? (
                        <img src={post.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        post.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <Link to={`/profile/${post.user_id}`}>
                        <p className="text-sm font-semibold text-gray-100 hover:text-red-400 transition">{post.full_name || post.username}</p>
                      </Link>
                      <p className="text-xs text-gray-500 font-mono">@{post.username}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
