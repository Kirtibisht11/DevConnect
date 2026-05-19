import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../../api/axios';

export default function PeopleYouMayKnow() {
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // Fixed: was '/users/suggestions/people' which doesn't exist on the backend
        const res = await api.get('/users/suggestions');
        setSuggestions(res.data.suggestions);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuggestions();
  }, []);

  const handleFollow = async (id) => {
    try {
      const res = await api.post(`/users/${id}/follow`);
      setFollowing(prev => ({ ...prev, [id]: res.data.following }));
    } catch (err) {
      console.error(err);
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="home-suggestions-card bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-4">// people you may know</h3>
      <div className="space-y-4">
        {suggestions.map(user => (
          <div key={user.id} className="flex items-center gap-3">
            <Link to={`/profile/${user.id}`}>
              <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                {user.username?.[0]?.toUpperCase()}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${user.id}`}>
                <p className="text-sm font-semibold text-gray-200 truncate hover:text-red-400 transition">
                  {user.full_name || user.username}
                </p>
              </Link>
              {user.headline && (
                <p className="text-xs text-gray-500 truncate">{user.headline}</p>
              )}
              {user.skills?.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {user.skills.slice(0, 2).map((skill, i) => (
                    <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleFollow(user.id)}
              className={`shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition font-mono ${
                following[user.id]
                  ? 'bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a]'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <UserPlus size={11} />
              {following[user.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
