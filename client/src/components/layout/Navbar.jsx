import { Link } from 'react-router-dom';
import { Home, Search, Bell, User, LogOut, Code2, Briefcase, Bookmark, MessageSquare, Shield } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b border-[#2a2a2a] h-14">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Code2 size={22} className="text-red-500" />
          <span className="text-white">Dev</span>
          <span className="text-red-500">Connect</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {[
            { to: '/', icon: Home, label: 'Home' },
            { to: '/messages', icon: MessageSquare, label: 'Messages' },
            { to: '/search', icon: Search, label: 'Search' },
            { to: '/notifications', icon: Bell, label: 'Alerts' },
            { to: `/profile/${user?.id}`, icon: User, label: 'Profile' },
            { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
            { to: '/jobs', icon: Briefcase, label: 'Jobs' },
          ].map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center px-3 py-2 text-gray-500 hover:text-red-500 transition rounded-lg hover:bg-[#1a1a1a] group"
            >
              <Icon size={18} />
              <span className="text-[10px] mt-0.5">{label}</span>
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex flex-col items-center px-3 py-2 text-gray-500 hover:text-red-500 transition rounded-lg hover:bg-[#1a1a1a]"
            >
              <Shield size={18} />
              <span className="text-[10px] mt-0.5">Admin</span>
            </Link>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 font-bold text-xs">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-300">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-[#1a1a1a] rounded-lg transition"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </nav>
  );
}