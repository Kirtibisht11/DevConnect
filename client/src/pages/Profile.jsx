import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Globe,
  Edit3,
  UserPlus,
  UserMinus,
  Briefcase,
  MessageSquare
} from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import PostCard from '../components/post/PostCard';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({});

  const isOwnProfile = currentUser?.id === id;

  const fetchProfile = async () => {
    try {
      const [userRes, followersRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/followers`)
      ]);

      setProfile(userRes.data.user);
      setEditForm(userRes.data.user);

      setFollowersCount(followersRes.data.count);

      const isFollowingMe = followersRes.data.followers.some(
        f => f.id === currentUser?.id
      );

      setIsFollowing(isFollowingMe);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await api.get('/posts/explore');

      const userPosts = res.data.posts.filter(
        p => p.user_id === id
      );

      setPosts(userPosts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [id]);

  const handleFollow = async () => {
    try {
      const res = await api.post(`/users/${id}/follow`);

      setIsFollowing(res.data.following);

      setFollowersCount(prev =>
        res.data.following ? prev + 1 : prev - 1
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/users/${id}`, editForm);

      setIsEditing(false);

      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const val = e.target.value.trim();

      if (
        val &&
        !(Array.isArray(editForm.skills) &&
          editForm.skills.includes(val))
      ) {
        setEditForm({
          ...editForm,
          skills: [
            ...(Array.isArray(editForm.skills)
              ? editForm.skills
              : []),
            val
          ]
        });
      }

      e.target.value = '';
    }
  };

  const handleRemoveSkill = (index) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter((_, i) => i !== index)
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(prev => ({
        ...prev,
        avatar_url: res.data.avatar_url
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('cover', file);

    try {
      const res = await api.post('/upload/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(prev => ({
        ...prev,
        cover_url: res.data.cover_url
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="text-center pt-32 text-gray-400">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto pt-20 px-4 pb-10">

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">

          {/* Cover */}
          <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600 group">

            {profile?.cover_url && (
              <img
                src={profile.cover_url}
                alt="cover"
                className="w-full h-full object-cover"
              />
            )}

            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition cursor-pointer">

                <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                  Change Cover
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </label>
            )}
          </div>

          <div className="px-6 pb-6">

            <div className="flex items-end justify-between -mt-10 mb-4">

              {/* Avatar */}
              <div className="relative w-20 h-20 group">

                <div className="w-20 h-20 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center text-indigo-600 font-bold text-2xl overflow-hidden">

                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.username?.[0]?.toUpperCase()
                  )}
                </div>

                {isOwnProfile && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">

                    <span className="text-white text-xs">
                      Edit
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-2">

                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">

                    <button
                      onClick={handleFollow}
                      className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full transition ${
                        isFollowing
                          ? 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus size={14} />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Follow
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate(`/messages?user=${id}`)}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm px-4 py-1.5 rounded-full hover:bg-gray-50 transition"
                    >
                      <MessageSquare size={14} />
                      Message
                    </button>

                  </div>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing ? (
              <div className="space-y-3">

                <div className="grid grid-cols-2 gap-3">

                  <input
                    value={editForm.full_name || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        full_name: e.target.value
                      })
                    }
                    placeholder="Full name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />

                  <input
                    value={editForm.headline || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        headline: e.target.value
                      })
                    }
                    placeholder="Headline"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      bio: e.target.value
                    })
                  }
                  placeholder="Bio"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />

                <div className="grid grid-cols-2 gap-3">

                  <input
                    value={editForm.location || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        location: e.target.value
                      })
                    }
                    placeholder="Location"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />

                  <input
                    value={editForm.github_url || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        github_url: e.target.value
                      })
                    }
                    placeholder="GitHub URL"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <input
                  value={editForm.website_url || ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      website_url: e.target.value
                    })
                  }
                  placeholder="Website URL"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />

                {/* Skills */}
                <div>

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Skills
                  </p>

                  <div className="min-h-10 flex flex-wrap gap-2 mb-2">

                    {(Array.isArray(editForm.skills)
                      ? editForm.skills
                      : []).map((skill, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium"
                      >
                        {skill}

                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(i)}
                          className="ml-1 text-indigo-400 hover:text-red-500 transition font-bold text-sm leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Type skill and press Enter"
                    onKeyDown={handleSkillKeyDown}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                {/* Open to work */}
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">

                  <input
                    type="checkbox"
                    id="open_to_work"
                    checked={editForm.open_to_work || false}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        open_to_work: e.target.checked
                      })
                    }
                    className="rounded accent-green-600 w-4 h-4"
                  />

                  <label
                    htmlFor="open_to_work"
                    className="text-sm text-green-700 font-medium cursor-pointer"
                  >
                    Open to work
                  </label>
                </div>

                {/* Save Buttons */}
                <div className="flex gap-2 pt-1">

                  <button
                    onClick={handleEditSave}
                    className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Save Changes
                  </button>

                  <button
                    onClick={() => setIsEditing(false)}
                    className="border border-gray-300 text-gray-600 text-sm px-5 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>

                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">

                  <h1 className="text-xl font-bold text-gray-900">
                    {profile?.full_name || profile?.username}
                  </h1>

                  {profile?.open_to_work && (
                    <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium border border-green-100">
                      <Briefcase size={11} />
                      Open to work
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm">
                  @{profile?.username}
                </p>

                {profile?.headline && (
                  <p className="text-gray-700 text-sm mt-1">
                    {profile.headline}
                  </p>
                )}

                {profile?.bio && (
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">

                  {profile?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {profile.location}
                    </span>
                  )}

                  {profile?.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-indigo-600 transition"
                    >
                      <Globe size={14} />
                      GitHub
                    </a>
                  )}

                  {profile?.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-indigo-600 transition"
                    >
                      <Globe size={14} />
                      Website
                    </a>
                  )}
                </div>

                <div className="flex gap-6 mt-4 text-sm">

                  <div>
                    <span className="font-bold text-gray-900">
                      {posts.length}
                    </span>

                    <span className="text-gray-500 ml-1">
                      Posts
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-gray-900">
                      {followersCount}
                    </span>

                    <span className="text-gray-500 ml-1">
                      Followers
                    </span>
                  </div>

                </div>

                {profile?.skills?.length > 0 && (
                  <div className="mt-4">

                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Skills
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {profile.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1 rounded-full font-medium border border-indigo-100"
                        >
                          {skill}
                        </span>
                      ))}

                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Posts */}
        <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          Posts
        </h2>

        {posts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No posts yet.
          </div>
        ) : (
          <div className="space-y-4">

            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={fetchUserPosts}
              />
            ))}

          </div>
        )}
      </div>
    </div>
  );
}