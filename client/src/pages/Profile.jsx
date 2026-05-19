import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Globe, Edit3, UserPlus, UserMinus, Briefcase, MessageSquare,
  GraduationCap, FileText
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PostCard from '../components/post/PostCard';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    summary: '',
    certifications: [],
    education: [],
    experience: []
  });
  const [summaryError, setSummaryError] = useState('');

  const isOwnProfile = currentUser?.id === id;
  const storageKey = `devconnect-profile-extras-${id}`;

  const mergeLocalProfileExtras = useCallback(userData => {
    if (typeof window === 'undefined') return userData;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return userData;

    try {
      const extras = JSON.parse(saved || '{}');
      return {
        ...userData,
        summary: extras.summary || userData.summary || '',
        certifications: extras.certifications || userData.certifications || [],
        education: extras.education || userData.education || [],
        experience: extras.experience || userData.experience || []
      };
    } catch {
      return userData;
    }
  }, [storageKey]);

  const saveLocalProfileExtras = extras => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(extras));
  };

  const fetchProfile = useCallback(async () => {
    try {
      const [userRes, followersRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/followers`)
      ]);

      const mergedProfile = mergeLocalProfileExtras({
        ...userRes.data.user,
        summary: userRes.data.user.summary || '',
        certifications: userRes.data.user.certifications || [],
        education: userRes.data.user.education || [],
        experience: userRes.data.user.experience || []
      });

      setProfile(mergedProfile);
      setEditForm(mergedProfile);
      setFollowersCount(followersRes.data.count);
      const isFollowingMe = followersRes.data.followers.some(f => f.id === currentUser?.id);
      setIsFollowing(isFollowingMe);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUser, mergeLocalProfileExtras]);

  const fetchUserPosts = useCallback(async () => {
    try {
      const res = await api.get('/posts/explore');
      const userPosts = res.data.posts.filter(p => p.user_id === id);
      setPosts(userPosts);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [fetchProfile, fetchUserPosts]);

  const handleFollow = async () => {
    try {
      const res = await api.post(`/users/${id}/follow`);
      setIsFollowing(res.data.following);
      setFollowersCount(prev => res.data.following ? prev + 1 : prev - 1);
    } catch (err) { console.error(err); }
  };

  const handleEditSave = async () => {
    if (!editForm.summary?.trim()) {
      setSummaryError('Profile summary is required to make your profile stand out.');
      return;
    }

    try {
      await api.put(`/users/${id}`, editForm);
      setSummaryError('');
      saveLocalProfileExtras({
        summary: editForm.summary,
        certifications: editForm.certifications || [],
        education: editForm.education || [],
        experience: editForm.experience || []
      });
      setIsEditing(false);
      fetchProfile();
    } catch (err) { console.error(err); }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val && !(Array.isArray(editForm.skills) && editForm.skills.includes(val))) {
        setEditForm({ ...editForm, skills: [...(Array.isArray(editForm.skills) ? editForm.skills : []), val] });
      }
      e.target.value = '';
    }
  };

  const handleRemoveSkill = (index) => {
    setEditForm({ ...editForm, skills: editForm.skills.filter((_, i) => i !== index) });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
      updateUser({ avatar_url: res.data.avatar_url });
    } catch (err) { console.error(err); }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('cover', file);
    try {
      const res = await api.post('/upload/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => ({ ...prev, cover_url: res.data.cover_url }));
    } catch (err) { console.error(err); }
  };

  const inputClass = "w-full border border-[#2a2a2a] bg-[#1a1a1a] text-gray-200 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition";

  if (isLoading) {
    return (
      <div className="min-h-screen page-shell">
        <Navbar />
        <div className="pt-14 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            <p className="text-gray-500 font-mono text-sm">// loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-shell">
      <Navbar />

      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">
          <div className="flex gap-6 justify-center">

            {/* Profile Card - left column */}
            <div className="flex-1 min-w-0 max-w-6xl mx-auto">
              <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden mb-5 w-full mx-auto">

                {/* Cover */}
                <div className="relative h-40 bg-gradient-to-r from-red-900/60 to-red-500/30 group">
                  {profile?.cover_url && (
                    <img src={profile.cover_url} alt="cover" className="w-full h-full object-cover" />
                  )}
                  {isOwnProfile && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <span className="text-white text-xs font-mono bg-black/60 px-3 py-1.5 rounded-full">Change Cover</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  )}
                </div>

                <div className="px-6 pb-6 md:px-10">
                  <div className="flex items-end justify-between -mt-10 mb-4">

                    {/* Avatar */}
                    <div className="relative w-20 h-20 group">
                      <div className="w-20 h-20 rounded-full bg-red-500/10 border-4 border-[#111111] flex items-center justify-center text-red-400 font-bold text-2xl overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          profile?.username?.[0]?.toUpperCase()
                        )}
                      </div>
                      {isOwnProfile && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                          <span className="text-white text-xs font-mono">Edit</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 mb-1">
                      {isOwnProfile ? (
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="flex items-center gap-1.5 border border-[#2a2a2a] text-gray-300 hover:border-red-500/50 hover:text-red-400 text-sm px-4 py-1.5 rounded-lg transition font-mono"
                        >
                          <Edit3 size={13} />
                          {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleFollow}
                            className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg transition font-mono ${
                              isFollowing
                                ? 'border border-[#2a2a2a] text-gray-400 hover:border-red-500/30'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {isFollowing ? <><UserMinus size={13} /> Unfollow</> : <><UserPlus size={13} /> Follow</>}
                          </button>
                          <button
                            onClick={() => navigate(`/messages?user=${id}`)}
                            className="flex items-center gap-1.5 border border-[#2a2a2a] text-gray-400 hover:border-red-500/30 hover:text-red-400 text-sm px-3 py-1.5 rounded-lg transition"
                          >
                            <MessageSquare size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  {isEditing ? (
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Full Name" className={inputClass} />
                        <input value={editForm.headline || ''} onChange={e => setEditForm({ ...editForm, headline: e.target.value })} placeholder="Headline" className={inputClass} />
                      </div>

                      <div>
                        <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-2">// profile summary</p>
                        <textarea
                          value={editForm.summary || ''}
                          onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                          placeholder="Tell people who you are, what you do, and what makes you unique."
                          rows={6}
                          className={`${inputClass} resize-y leading-relaxed font-sans`}
                        />
                        {summaryError && <p className="text-sm text-red-400 mt-1">{summaryError}</p>}
                      </div>

                      <textarea value={editForm.bio || ''} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Bio" rows={4} className={`${inputClass} resize-y leading-relaxed font-sans`} />

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="Location" className={inputClass} />
                        <input value={editForm.github_url || ''} onChange={e => setEditForm({ ...editForm, github_url: e.target.value })} placeholder="GitHub URL" className={inputClass} />
                      </div>
                      <input value={editForm.website_url || ''} onChange={e => setEditForm({ ...editForm, website_url: e.target.value })} placeholder="Website URL" className={inputClass} />

                      <div>
                        <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-2">// skills</p>
                        <div className="min-h-10 flex flex-wrap gap-2 mb-2">
                          {(Array.isArray(editForm.skills) ? editForm.skills : []).map((skill, i) => (
                            <span key={i} className="flex items-center gap-1 bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/20">
                              {skill}
                              <button type="button" onClick={() => handleRemoveSkill(i)} className="ml-1 text-red-400 hover:text-red-300 font-bold text-sm leading-none">×</button>
                            </span>
                          ))}
                        </div>
                        <input type="text" placeholder="Type skill and press Enter" onKeyDown={handleSkillKeyDown} className={inputClass} />
                      </div>

                      <div>
                        <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-2">// certifications</p>
                        <div className="min-h-10 flex flex-wrap gap-2 mb-2">
                          {(Array.isArray(editForm.certifications) ? editForm.certifications : []).map((cert, i) => (
                            <span key={i} className="flex items-center gap-1 bg-slate-700/40 text-slate-200 text-xs px-3 py-1 rounded-full border border-slate-600">
                              {cert}
                              <button type="button" onClick={() => setEditForm({ ...editForm, certifications: editForm.certifications.filter((_, index) => index !== i) })} className="ml-1 text-slate-300 hover:text-white font-bold text-sm leading-none">×</button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Add certification and press Enter"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (!val) return;
                              const next = Array.isArray(editForm.certifications) ? editForm.certifications : [];
                              if (!next.includes(val)) {
                                setEditForm({ ...editForm, certifications: [...next, val] });
                              }
                              e.target.value = '';
                            }
                          }}
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">// education</p>
                            <p className="text-gray-600 text-sm">Add schools, degrees, and graduation year.</p>
                          </div>
                          <button type="button" onClick={() => setEditForm({ ...editForm, education: [...(Array.isArray(editForm.education) ? editForm.education : []), { school: '', degree: '', field: '', year: '' }] })} className="inline-flex items-center gap-1 text-xs text-red-400 uppercase tracking-wide font-semibold hover:text-red-300">
                            + add education
                          </button>
                        </div>
                        {(Array.isArray(editForm.education) ? editForm.education : []).map((edu, index) => (
                          <div key={index} className="grid grid-cols-1 gap-3 lg:grid-cols-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                            <input value={edu.school || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.education) ? editForm.education : [])];
                              next[index] = { ...next[index], school: e.target.value };
                              setEditForm({ ...editForm, education: next });
                            }} placeholder="School / Institution" className={inputClass} />
                            <input value={edu.degree || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.education) ? editForm.education : [])];
                              next[index] = { ...next[index], degree: e.target.value };
                              setEditForm({ ...editForm, education: next });
                            }} placeholder="Degree / Program" className={inputClass} />
                            <input value={edu.field || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.education) ? editForm.education : [])];
                              next[index] = { ...next[index], field: e.target.value };
                              setEditForm({ ...editForm, education: next });
                            }} placeholder="Field of study" className={inputClass} />
                            <input value={edu.year || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.education) ? editForm.education : [])];
                              next[index] = { ...next[index], year: e.target.value };
                              setEditForm({ ...editForm, education: next });
                            }} placeholder="Year" className={inputClass} />
                            <button type="button" onClick={() => {
                              const next = [...(Array.isArray(editForm.education) ? editForm.education : [])];
                              next.splice(index, 1);
                              setEditForm({ ...editForm, education: next });
                            }} className="text-xs text-red-400 hover:text-red-300 text-left lg:col-span-4">
                              Remove education
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">// work experience</p>
                            <p className="text-gray-600 text-sm">Add your role, organization and duration.</p>
                          </div>
                          <button type="button" onClick={() => setEditForm({ ...editForm, experience: [...(Array.isArray(editForm.experience) ? editForm.experience : []), { role: '', company: '', duration: '', detail: '' }] })} className="inline-flex items-center gap-1 text-xs text-red-400 uppercase tracking-wide font-semibold hover:text-red-300">
                            + add experience
                          </button>
                        </div>
                        {(Array.isArray(editForm.experience) ? editForm.experience : []).map((exp, index) => (
                          <div key={index} className="grid grid-cols-1 gap-3 lg:grid-cols-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-4">
                            <input value={exp.role || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.experience) ? editForm.experience : [])];
                              next[index] = { ...next[index], role: e.target.value };
                              setEditForm({ ...editForm, experience: next });
                            }} placeholder="Role / Title" className={inputClass} />
                            <input value={exp.company || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.experience) ? editForm.experience : [])];
                              next[index] = { ...next[index], company: e.target.value };
                              setEditForm({ ...editForm, experience: next });
                            }} placeholder="Organization" className={inputClass} />
                            <input value={exp.duration || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.experience) ? editForm.experience : [])];
                              next[index] = { ...next[index], duration: e.target.value };
                              setEditForm({ ...editForm, experience: next });
                            }} placeholder="Duration (e.g. 2022 - present)" className={inputClass} />
                            <input value={exp.detail || ''} onChange={e => {
                              const next = [...(Array.isArray(editForm.experience) ? editForm.experience : [])];
                              next[index] = { ...next[index], detail: e.target.value };
                              setEditForm({ ...editForm, experience: next });
                            }} placeholder="Additional details" className={inputClass} />
                            <button type="button" onClick={() => {
                              const next = [...(Array.isArray(editForm.experience) ? editForm.experience : [])];
                              next.splice(index, 1);
                              setEditForm({ ...editForm, experience: next });
                            }} className="text-xs text-red-400 hover:text-red-300 text-left lg:col-span-4">
                              Remove experience
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button onClick={handleEditSave} className="bg-red-500 hover:bg-red-600 text-white text-sm px-5 py-2 rounded-lg font-mono transition">
                          $ save --changes
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditForm(profile); setSummaryError(''); }} className="border border-[#2a2a2a] text-gray-500 hover:text-gray-300 text-sm px-5 py-2 rounded-lg font-mono transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 flex-wrap text-center">
                        <h1 className="text-2xl font-bold text-gray-100">{profile?.full_name || profile?.username}</h1>
                        {profile?.open_to_work && (
                          <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                            <Briefcase size={11} /> Open to work
                          </span>
                        )}
                      </div>
                      <p className="text-center text-gray-500 text-sm font-mono">@{profile?.username}</p>
                      {profile?.headline && <p className="text-center text-gray-300 text-sm mt-1">{profile.headline}</p>}
                      {profile?.bio && <p className="mx-auto max-w-4xl text-center text-gray-400 text-[15px] mt-3 leading-7">{profile.bio}</p>}

                      {profile?.summary ? (
                        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-6 text-center md:px-12">
                          <div className="flex items-center justify-center gap-2 text-sm text-red-300 mb-3 font-semibold">
                            <FileText size={16} /> Profile summary
                          </div>
                          <p className="mx-auto max-w-5xl text-gray-300 text-base leading-8">{profile.summary}</p>
                        </div>
                      ) : isOwnProfile ? (
                        <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center text-sm text-yellow-200">
                          Add a profile summary to highlight your story and make your profile stand out.
                        </div>
                      ) : null}

                      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-gray-500">
                        {profile?.location && <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>}
                        {profile?.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-red-400 transition">
                            <Globe size={13} /> GitHub
                          </a>
                        )}
                        {profile?.website_url && (
                          <a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-red-400 transition">
                            <Globe size={13} /> Website
                          </a>
                        )}
                      </div>

                      <div className="flex justify-center gap-6 mt-4 text-sm">
                        <div><span className="font-bold text-gray-100">{posts.length}</span><span className="text-gray-500 ml-1">Posts</span></div>
                        <div><span className="font-bold text-gray-100">{followersCount}</span><span className="text-gray-500 ml-1">Followers</span></div>
                      </div>

                      {(profile?.skills?.length > 0 || profile?.certifications?.length > 0) && (
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                          {profile?.skills?.length > 0 && (
                            <div>
                              <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-2">// skills</p>
                              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                                {profile.skills.map((skill, i) => (
                                  <span key={i} className="bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/20">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {profile?.certifications?.length > 0 && (
                            <div>
                              <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-2">// certifications</p>
                              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                                {profile.certifications.map((cert, i) => (
                                  <span key={i} className="bg-slate-700/40 text-slate-200 text-xs px-3 py-1 rounded-full border border-slate-600">{cert}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {profile?.education?.length > 0 && (
                <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6 mb-5">
                  <div className="flex items-center justify-center gap-2 mb-5 text-red-300 font-semibold text-sm uppercase tracking-[0.18em]">
                    <GraduationCap size={16} /> Education
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5">
                        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-100">{edu.degree || 'No degree provided'}</h3>
                            <p className="text-xs text-gray-500">{edu.school || 'Institution not added'}</p>
                          </div>
                          <span className="text-xs text-gray-500">{edu.year || 'Year'}</span>
                        </div>
                        <p className="mt-3 text-center text-sm text-gray-400 sm:text-left">{edu.field || 'Field of study not specified'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile?.experience?.length > 0 && (
                <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6 mb-5">
                  <div className="flex items-center justify-center gap-2 mb-5 text-red-300 font-semibold text-sm uppercase tracking-[0.18em]">
                    <Briefcase size={16} /> Work experience
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5">
                        <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-100">{exp.role || 'No role provided'}</h3>
                            <p className="text-xs text-gray-500">{exp.company || 'Organization not added'}</p>
                          </div>
                          <span className="text-xs text-gray-500">{exp.duration || 'Duration unknown'}</span>
                        </div>
                        <p className="mt-3 text-center text-sm text-gray-400 sm:text-left">{exp.detail || 'No additional details.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-3">// posts</p>
              {posts.length === 0 ? (
                <div className="text-center text-gray-600 py-10 font-mono">// no posts yet</div>
              ) : (
                <div className="space-y-6">
                  {posts.map(post => <PostCard key={post.id} post={post} onUpdate={fetchUserPosts} />)}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
