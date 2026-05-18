import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Jobs from './pages/Jobs';
import Bookmarks from './pages/Bookmarks';
import Messages from './pages/Messages';
import Admin from './pages/Admin';
const ProtectedRoute = ({ children }) => {
  const { accessToken } = useAuthStore();
  return accessToken ? children : <Navigate to="/login" />;
};

function App() {
  const { getMe, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) getMe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/profile/:id" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
  <ProtectedRoute>
    <Messages />
  </ProtectedRoute>
} />
<Route path="/admin" element={
  <ProtectedRoute>
    <Admin />
  </ProtectedRoute>
} />
        <Route path="/notifications" element={
  <ProtectedRoute>
    <Notifications />
  </ProtectedRoute>
} />
<Route path="/bookmarks" element={
  <ProtectedRoute>
    <Bookmarks />
  </ProtectedRoute>
} />
<Route path="/jobs" element={
  <ProtectedRoute>
    <Jobs />
  </ProtectedRoute>
} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;