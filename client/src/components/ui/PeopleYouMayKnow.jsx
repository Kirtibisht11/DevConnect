import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../../api/axios';

export default function PeopleYouMayKnow() {
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/users/suggestions/people');
        setSuggestions(res.data.suggestions);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">People you may know</h3>
      <div className="space-y-4">
        {suggestions.map(user => (
          <div key={user.id} className="flex items-center gap-3">
            <Link to={`/profile/${user.id}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                {user.username?.[0]?.toUpperCase()}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${user.id}`}>
                <p className="text-sm font-semibold text-gray-800 truncate hover:underline">
                  {user.full_name || user.username}
                </p>
              </Link>
              {user.headline && (
                <p className="text-xs text-gray-400 truncate">{user.headline}</p>
              )}
              {user.skills?.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {user.skills.slice(0, 2).map((skill, i) => (
                    <span key={i} className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleFollow(user.id)}
              className={`shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition ${
                following[user.id]
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
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