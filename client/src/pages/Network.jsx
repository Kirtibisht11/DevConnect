import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search, UserPlus, Users } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const emptyCopy = {
  followers: {
    title: '// no followers yet',
    body: 'People who follow you will show up here.',
  },
  following: {
    title: '// not following anyone yet',
    body: 'Follow developers from search or profiles to build your network.',
  },
  all: {
    title: '// your network is empty',
    body: 'Followers and people you follow will show up here.',
  },
};

function PersonCard({ person, relation }) {
  return (
    <article className="network-person-card bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 hover:border-red-500/30 transition">
      <div className="flex items-start gap-3">
        <Link
          to={`/profile/${person.id}`}
          className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-lg shrink-0 overflow-hidden"
        >
          {person.avatar_url ? (
            <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            person.username?.[0]?.toUpperCase()
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/profile/${person.id}`} className="font-semibold text-gray-100 hover:text-red-400 transition truncate">
              {person.full_name || person.username}
            </Link>
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-mono text-red-400">
              {relation}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 font-mono">@{person.username}</p>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
            {person.headline || 'DevConnect member'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to={`/profile/${person.id}`}
          className="flex-1 rounded-lg border border-[#2a2a2a] px-3 py-2 text-center text-xs font-mono text-gray-300 hover:border-red-500/40 hover:text-red-400 transition"
        >
          View profile
        </Link>
        <Link
          to={`/messages?user=${person.id}`}
          className="rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-600 transition"
          title={`Message ${person.username}`}
        >
          <MessageSquare size={15} />
        </Link>
      </div>
    </article>
  );
}

export default function Network() {
  const { user } = useAuthStore();
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNetwork = async () => {
      setIsLoading(true);
      try {
        const [followersRes, followingRes] = await Promise.all([
          api.get(`/users/${user.id}/followers`),
          api.get(`/users/${user.id}/following`),
        ]);

        setFollowers(followersRes.data.followers || []);
        setFollowing(followingRes.data.following || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetwork();
  }, [user?.id]);

  const people = useMemo(() => {
    const map = new Map();

    followers.forEach((person) => {
      map.set(person.id, { ...person, relation: 'Follows you' });
    });

    following.forEach((person) => {
      const existing = map.get(person.id);
      map.set(person.id, {
        ...person,
        relation: existing ? 'Mutual' : 'Following',
      });
    });

    const base = activeTab === 'followers'
      ? followers.map((person) => ({ ...person, relation: 'Follows you' }))
      : activeTab === 'following'
        ? following.map((person) => ({ ...person, relation: map.get(person.id)?.relation || 'Following' }))
        : Array.from(map.values());

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return base;

    return base.filter((person) => (
      person.username?.toLowerCase().includes(normalizedQuery)
      || person.full_name?.toLowerCase().includes(normalizedQuery)
      || person.headline?.toLowerCase().includes(normalizedQuery)
    ));
  }, [activeTab, followers, following, query]);

  const tabs = [
    { id: 'all', label: 'All', count: new Set([...followers, ...following].map((person) => person.id)).size },
    { id: 'followers', label: 'Followers', count: followers.length },
    { id: 'following', label: 'Following', count: following.length },
  ];

  const currentEmptyCopy = query ? {
    title: '// no matching people',
    body: 'Try a different name, username, or headline.',
  } : emptyCopy[activeTab];

  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="pt-14 min-h-screen">
        <main className="network-page-box page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">
          <section className="network-hero mb-6 overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/60 via-[#111111] to-[#0a0a0a] p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="network-hero-icon mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                  <Users size={20} className="text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-100 font-mono">// my_network</h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400">
                  Everyone who follows you, everyone you follow, and mutual connections in one place.
                </p>
              </div>
              <div className="network-stat-box grid grid-cols-3 gap-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a]/60 p-2 text-center">
                <div className="px-4 py-2">
                  <p className="text-lg font-bold text-gray-100">{followers.length}</p>
                  <p className="text-[11px] text-gray-500 font-mono">followers</p>
                </div>
                <div className="px-4 py-2">
                  <p className="text-lg font-bold text-gray-100">{following.length}</p>
                  <p className="text-[11px] text-gray-500 font-mono">following</p>
                </div>
                <div className="px-4 py-2">
                  <p className="text-lg font-bold text-gray-100">
                    {following.filter((person) => followers.some((follower) => follower.id === person.id)).length}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">mutual</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg border px-4 py-2 text-sm font-mono transition ${
                    activeTab === tab.id
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-[#2a2a2a] bg-[#111111] text-gray-400 hover:border-red-500/30 hover:text-red-400'
                  }`}
                >
                  {tab.label} <span className="opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3 md:w-80">
              <Search size={17} className="text-gray-500 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search network..."
                className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <p className="text-gray-500 font-mono text-sm">// loading network...</p>
            </div>
          ) : people.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a]">
                <UserPlus size={28} className="text-gray-700" />
              </div>
              <p className="text-gray-500 font-mono">{currentEmptyCopy.title}</p>
              <p className="mt-1 text-sm text-gray-600">{currentEmptyCopy.body}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {people.map((person) => (
                <PersonCard key={`${activeTab}-${person.id}`} person={person} relation={person.relation} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
