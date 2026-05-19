import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, Plus, X, ExternalLink, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const EXP_LEVELS = ['entry', 'mid', 'senior', 'any'];

const typeColors = {
  'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
  'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'contract': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'internship': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'remote': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

export default function Jobs() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    title: '', company: '', location: '', type: 'full-time',
    description: '', tech_stack: '', experience_level: 'any', apply_url: '', deadline: ''
  });

  const fetchJobs = useCallback(async () => {
    try {
      const params = filterType ? `?type=${filterType}` : '';
      const res = await api.get(`/jobs${params}`);
      setJobs(res.data.jobs);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [filterType]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jobs', { ...form, tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean) });
      setShowForm(false);
      setForm({ title: '', company: '', location: '', type: 'full-time', description: '', tech_stack: '', experience_level: 'any', apply_url: '', deadline: '' });
      fetchJobs();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/jobs/${id}`); fetchJobs(); }
    catch (err) { console.error(err); }
  };

  const inputClass = "w-full border border-[#2a2a2a] bg-[#1a1a1a] text-gray-200 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition";

  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 font-mono">// job_board</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-mono">find your next developer role</p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-mono font-medium transition">
              <Plus size={16} /> Post a Job
            </button>
          </div>

          {/* Post Job Form */}
          {showForm && (
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-100 font-mono">// post_new_job</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300 transition">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Job Title *" required className={inputClass} />
                  <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company Name *" required className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Location" className={inputClass} />
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputClass}>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={form.tech_stack} onChange={e => setForm({...form, tech_stack: e.target.value})} placeholder="Tech stack (comma separated)" className={inputClass} />
                  <select value={form.experience_level} onChange={e => setForm({...form, experience_level: e.target.value})} className={inputClass}>
                    {EXP_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Job description *" required rows={4} className={`${inputClass} resize-none`} />
                <input value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} placeholder="Application deadline (YYYY-MM-DD)" className={inputClass} />
                <input value={form.apply_url} onChange={e => setForm({...form, apply_url: e.target.value})} placeholder="Application URL" className={inputClass} />
                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-mono font-medium transition">$ post --job</button>
              </form>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button onClick={() => setFilterType('')}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition border ${!filterType ? 'bg-red-500 text-white border-red-500' : 'bg-transparent border-[#2a2a2a] text-gray-400 hover:border-red-500/30'}`}>
              All
            </button>
            {JOB_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono capitalize transition border ${filterType === t ? 'bg-red-500 text-white border-red-500' : 'bg-transparent border-[#2a2a2a] text-gray-400 hover:border-red-500/30'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Jobs Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <p className="text-gray-500 font-mono text-sm">// loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <Briefcase size={28} className="text-gray-700" />
              </div>
              <p className="text-gray-500 font-mono">// no jobs posted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobs.map(job => {
                const hasDeadline = Boolean(job.deadline);
                const deadlineDate = hasDeadline ? new Date(job.deadline) : null;
                const deadlineText = hasDeadline && !Number.isNaN(deadlineDate.getTime())
                  ? format(deadlineDate, 'MMM d, yyyy')
                  : 'No deadline set';
                const isExpired = hasDeadline && !isAfter(deadlineDate, new Date());

                return (
                  <div key={job.id} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 hover:border-red-500/20 transition flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/jobs/${job.id}`} className="font-semibold text-gray-100 hover:text-red-400 transition">{job.title}</Link>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border shrink-0 ${typeColors[job.type] || 'bg-[#2a2a2a] text-gray-400 border-[#3a3a3a]'}`}>{job.type}</span>
                        </div>
                        <p className="text-sm font-medium text-red-400 mt-1">{job.company}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                          {job.location && <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>}
                          <span className="flex items-center gap-1"><Clock size={10} />{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                          {job.experience_level && job.experience_level !== 'any' && (
                            <span className="capitalize bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full">{job.experience_level}</span>
                          )}
                        </div>
                        <div className="mt-2 text-xs font-mono text-gray-400">
                          Deadline: <span className={isExpired ? 'text-red-400' : 'text-gray-200'}>{deadlineText}</span>
                        </div>
                      </div>
                      {job.poster_id === user?.id && (
                        <button onClick={() => handleDelete(job.id)} className="text-gray-600 hover:text-red-400 transition ml-2 shrink-0"><X size={15} /></button>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 flex-1">{job.description}</p>

                    {job.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.tech_stack.map((tech, i) => (
                          <span key={i} className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/20">{tech}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-gray-200 text-sm px-4 py-2 rounded-lg font-mono transition">
                        View job <ArrowRight size={13} />
                      </Link>
                      {job.apply_url && (
                        <a href={job.apply_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg font-mono transition">
                          Apply externally <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}