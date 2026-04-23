import { useState } from 'react';
import { Search as SearchIcon, MapPin, Briefcase } from 'lucide-react';
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
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/search?q=${query}&type=${type}`);
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-10">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3">
              <SearchIcon size={16} className="text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search developers, posts..."
                className="flex-1 py-2 text-sm outline-none"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 text-sm outline-none"
            >
              <option value="users">People</option>
              <option value="posts">Posts</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">Searching...</div>
        ) : searched && results.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No results found for "{query}"</div>
        ) : (
          <div className="space-y-3">
            {type === 'users' && results.map(user => (
              <Link
                key={user.id}
                to={`/profile/${user.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                    {user.headline && (
                      <p className="text-sm text-gray-600 mt-0.5">{user.headline}</p>
                    )}
                    {user.location && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={11} /> {user.location}
                      </p>
                    )}
                    {user.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.skills.slice(0, 4).map((skill, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {user.open_to_work && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                      <Briefcase size={11} /> Open to work
                    </span>
                  )}
                </div>
              </Link>
            ))}

            {type === 'posts' && results.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {post.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{post.full_name || post.username}</p>
                    <p className="text-xs text-gray-400">@{post.username}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}