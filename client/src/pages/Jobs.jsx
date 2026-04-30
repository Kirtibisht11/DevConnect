import { useEffect, useState } from 'react';
import { Briefcase, MapPin, Clock, Plus, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const EXP_LEVELS = ['entry', 'mid', 'senior', 'any'];

export default function Jobs() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    title: '', company: '', location: '', type: 'full-time',
    description: '', tech_stack: '', experience_level: 'any', apply_url: ''
  });

  const fetchJobs = async () => {
    try {
      const params = filterType ? `?type=${filterType}` : '';
      const res = await api.get(`/jobs${params}`);
      setJobs(res.data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jobs', {
        ...form,
        tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
      });
      setShowForm(false);
      setForm({
        title: '', company: '', location: '', type: 'full-time',
        description: '', tech_stack: '', experience_level: 'any', apply_url: ''
      });
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const typeColors = {
    'full-time': 'bg-green-50 text-green-700',
    'part-time': 'bg-blue-50 text-blue-700',
    'contract': 'bg-orange-50 text-orange-700',
    'internship': 'bg-purple-50 text-purple-700',
    'remote': 'bg-teal-50 text-teal-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto pt-20 px-4 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Job Board</h1>
            <p className="text-sm text-gray-400 mt-0.5">Find your next developer role</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
          >
            <Plus size={16} />
            Post a Job
          </button>
        </div>

        {/* Post Job Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Post a New Job</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Job Title *"
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={form.company}
                  onChange={e => setForm({...form, company: e.target.value})}
                  placeholder="Company Name *"
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="Location (e.g. Remote, Bengaluru)"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <select
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {JOB_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.tech_stack}
                  onChange={e => setForm({...form, tech_stack: e.target.value})}
                  placeholder="Tech stack (comma separated)"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <select
                  value={form.experience_level}
                  onChange={e => setForm({...form, experience_level: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {EXP_LEVELS.map(l => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Job description *"
                required
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
              />
              <input
                value={form.apply_url}
                onChange={e => setForm({...form, apply_url: e.target.value})}
                placeholder="Application URL (e.g. https://company.com/careers)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Post Job
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!filterType ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            All
          </button>
          {JOB_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No jobs posted yet</p>
            <p className="text-gray-300 text-sm mt-1">Be the first to post a job!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${typeColors[job.type] || 'bg-gray-50 text-gray-600'}`}>
                        {job.type}
                      </span>
                      {job.experience_level && job.experience_level !== 'any' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 capitalize">
                          {job.experience_level} level
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-indigo-600 mt-1">{job.company}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {job.poster_id === user?.id && (
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-gray-300 hover:text-red-400 transition ml-2"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">
                  {job.description}
                </p>

                {job.tech_stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.tech_stack.map((tech, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {job.apply_url && (
                  
                    <a href={job.apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Apply Now <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}