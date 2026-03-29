import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, Bell, User, LogOut, Code2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Code2 size={24} />
          DevConnect
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-indigo-600 transition">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/search" className="flex flex-col items-center text-gray-500 hover:text-indigo-600 transition">
            <Search size={20} />
            <span className="text-xs">Search</span>
          </Link>
          <Link to="/notifications" className="flex flex-col items-center text-gray-500 hover:text-indigo-600 transition">
            <Bell size={20} />
            <span className="text-xs">Notifications</span>
          </Link>
          <Link to={`/profile/${user?.id}`} className="flex flex-col items-center text-gray-500 hover:text-indigo-600 transition">
            <User size={20} />
            <span className="text-xs">Profile</span>
          </Link>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition text-sm"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </nav>
  );
}