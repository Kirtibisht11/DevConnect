import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, User, LogOut, Code2, Briefcase, Bookmark, MessageSquare, Shield, Users, Moon, Sun } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchUnreadCounts = async () => {
      try {
        const [alertsRes, messagesRes] = await Promise.all([
          api.get('/notifications/unread-count'),
          api.get('/messages/unread'),
        ]);

        setUnreadAlerts(alertsRes.data.count || 0);
        setUnreadMessages(messagesRes.data.count || 0);
      } catch (err) {
        console.error(err);
      }
    };

    const handleUnreadAlertsChange = (event) => {
      setUnreadAlerts(event.detail?.count || 0);
    };

    const handleUnreadMessagesChange = (event) => {
      setUnreadMessages(event.detail?.count || 0);
    };

    fetchUnreadCounts();
    window.addEventListener('notifications:unread-count', handleUnreadAlertsChange);
    window.addEventListener('messages:unread-count', handleUnreadMessagesChange);

    return () => {
      window.removeEventListener('notifications:unread-count', handleUnreadAlertsChange);
      window.removeEventListener('messages:unread-count', handleUnreadMessagesChange);
    };
  }, [user, location.pathname]);

  const navLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/network', icon: Users, label: 'Network' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: `/profile/${user?.id}`, icon: User, label: 'Profile' },
    { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  ];

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    if (to.startsWith('/profile/')) return location.pathname.startsWith('/profile/');
    return location.pathname === to;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-black via-[#111111]/95 to-[#330000]/90 backdrop-blur border-b border-red-900/20 h-14">
      <div className="mx-auto h-full flex w-full max-w-[1520px] items-center justify-between gap-4 px-8 sm:px-12 xl:px-16 2xl:px-20">

        {/* Logo */}
        <Link to="/" className="ml-6 flex items-center gap-2 font-bold text-lg shrink-0 lg:ml-10 xl:ml-14">
          <Code2 size={20} className="text-red-500" />
          <span className="text-white hidden sm:inline">Dev<span className="text-red-500">Connect</span></span>
        </Link>

        {/* Nav Links - centered */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-1 justify-center">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const alertCount = user ? unreadAlerts : 0;
            const messageCount = user ? unreadMessages : 0;
            const showAlertBadge = link.to === '/notifications' && alertCount > 0;
            const alertBadgeLabel = alertCount > 99 ? '99+' : alertCount;
            const showMessageBadge = link.to === '/messages' && messageCount > 0;
            const messageBadgeLabel = messageCount > 99 ? '99+' : messageCount;
            const badgeLabel = showAlertBadge ? alertBadgeLabel : messageBadgeLabel;
            const showBadge = showAlertBadge || showMessageBadge;

            return (
              <Link
                key={link.label}
                to={link.to}
                className={`relative flex flex-col items-center px-3.5 py-1.5 rounded-lg transition-all group ${
                  isActive(link.to)
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-gray-500 hover:text-red-400 hover:bg-[#1a1a1a]'
                }`}
              >
                <span className="relative">
                  <Icon size={17} />
                  {showBadge && (
                    <span className="absolute -right-2.5 -top-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 font-bold text-center shadow-sm shadow-red-950/50">
                      {badgeLabel}
                    </span>
                  )}
                </span>
                <span className="text-[10px] mt-0.5 font-mono hidden sm:block">{link.label}</span>
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`flex flex-col items-center px-3.5 py-1.5 rounded-lg transition-all ${
                location.pathname === '/admin'
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-gray-500 hover:text-red-400 hover:bg-[#1a1a1a]'
              }`}
            >
              <Shield size={17} />
              <span className="text-[10px] mt-0.5 font-mono hidden sm:block">Admin</span>
            </Link>
          )}
        </div>

        {/* Right side: user pill + logout */}
        <div className="mr-12 flex items-center gap-2.5 justify-end shrink-0 lg:mr-20 xl:mr-36 2xl:mr-44">
          <Link
            to={`/profile/${user?.id}`}
            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-red-500/30 rounded-full px-3 py-1.5 transition"
          >
            <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-xs shrink-0 overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.username?.[0]?.toUpperCase()
              )}
            </div>
            <span className="text-sm text-gray-300 font-mono hidden md:block">{user?.username}</span>
          </Link>
          <button
            type="button"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to night mode'}
            className="theme-toggle flex items-center gap-1.5 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={logout}
            title="Logout"
            className="flex items-center gap-1.5 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </nav>
  );
}
