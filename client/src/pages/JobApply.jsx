import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, ExternalLink, ArrowLeft, FileText, Upload, X } from 'lucide-react';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function JobApply() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data.job);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadJob();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (job && String(job.poster_id) === String(user?.id)) {
      setError('You cannot apply to your own job posting.');
      return;
    }

    setIsSubmitting(true);
    try {
      setError('');
      setSuccess('');

      let resumePayload = {};
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);

        const uploadRes = await api.post('/upload/resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        resumePayload = {
          resume_url: uploadRes.data.resume_url,
          resume_file_name: uploadRes.data.resume_file_name,
          resume_file_type: uploadRes.data.resume_file_type,
          resume_file_size: uploadRes.data.resume_file_size,
        };
      } else {
        resumePayload = { resume_url: resumeUrl };
      }

      const res = await api.post(`/jobs/${id}/apply`, {
        message,
        ...resumePayload,
      });

      setSuccess(res.data.message || 'Application submitted!');
      setMessage('');
      setResumeUrl('');
      setResumeFile(null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Could not submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen page-shell">
        <Navbar />
        <div className="pt-14 min-h-screen">
          <div className="page-box max-w-screen-xl mx-auto px-4 py-20 text-center text-gray-500 font-mono">
            Loading job details...
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen page-shell">
        <Navbar />
        <div className="pt-14 min-h-screen">
          <div className="page-box max-w-screen-xl mx-auto px-4 py-20 text-center text-gray-500 font-mono">
            Job not found.
          </div>
        </div>
      </div>
    );
  }

  const hasDeadline = Boolean(job.deadline);
  const deadlineDate = hasDeadline ? new Date(job.deadline) : null;
  const deadlineText = hasDeadline && !Number.isNaN(deadlineDate.getTime())
    ? format(deadlineDate, 'MMM d, yyyy')
    : 'No deadline set';
  const isExpired = hasDeadline && !isAfter(deadlineDate, new Date());
  const isOwnJob = String(job.poster_id) === String(user?.id);
  const posterName = job.full_name || job.username || 'Unknown poster';

  return (
    <div className="min-h-screen page-shell">
      <Navbar />
      <div className="pt-14 min-h-screen">
        <div className="page-box max-w-screen-xl mx-auto px-4 py-6 pb-10">
          <div className="flex flex-col gap-4 mb-6">
            <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition">
              <ArrowLeft size={16} /> Back to Jobs
            </Link>
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-semibold text-gray-100">{job.title}</h1>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 capitalize">{job.type}</span>
                  </div>
                  <p className="text-sm text-red-400 font-medium">{job.company}</p>
                  <p className="text-xs text-gray-500">
                    Posted by{' '}
                    <Link to={`/profile/${job.poster_id}`} className="font-medium text-gray-300 hover:text-red-400 transition">
                      {posterName}
                    </Link>
                    {isOwnJob && <span className="ml-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-yellow-300">Your post</span>}
                  </p>
                  <p className="text-sm text-gray-400">{job.description}</p>
                </div>
                <div className="grid gap-2 text-xs text-gray-400 font-mono">
                  {job.location && <span className="flex items-center gap-2"><MapPin size={14} /> {job.location}</span>}
                  <span className="flex items-center gap-2"><Clock size={14} /> Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  <span className={isExpired ? 'text-red-400' : 'text-gray-200'}>Deadline: {deadlineText}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.apply_url && (
                  <a href={job.apply_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition">
                    Apply externally <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Job details</h2>
              <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                <p><span className="font-semibold text-gray-100">Company:</span> {job.company}</p>
                <p>
                  <span className="font-semibold text-gray-100">Posted by:</span>{' '}
                  <Link to={`/profile/${job.poster_id}`} className="text-red-300 hover:text-red-200 transition">
                    {posterName}
                  </Link>
                  {isOwnJob && <span className="ml-2 text-yellow-300">(you)</span>}
                </p>
                <p><span className="font-semibold text-gray-100">Job type:</span> {job.type}</p>
                {job.location && <p><span className="font-semibold text-gray-100">Location:</span> {job.location}</p>}
                <p><span className="font-semibold text-gray-100">Experience level:</span> {job.experience_level || 'Any'}</p>
                {job.tech_stack?.length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-100">Tech stack:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.tech_stack.map((tech, index) => (
                        <span key={index} className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-full border border-red-500/20">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Apply now</h2>
              {isOwnJob && (
                <div className="mb-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                  You posted this job, so applications are disabled for your account.
                </div>
              )}
              <form className="space-y-4" onSubmit={handleApply}>
                <div>
                  <label className="text-xs text-gray-400 font-mono uppercase">Message</label>
                  <textarea disabled={isOwnJob} value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full mt-2 border border-[#2a2a2a] bg-[#0f0f0f] text-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed rounded-2xl px-4 py-3 text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition" placeholder="Add a short note for the employer" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-mono uppercase">Resume file</label>
                  <label className={`mt-2 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] px-4 py-4 text-sm text-gray-400 transition ${isOwnJob ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-red-500/40 hover:text-red-300'}`}>
                    <Upload size={16} />
                    Upload PDF, DOC, or DOCX
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      disabled={isOwnJob}
                      className="hidden"
                      onChange={(event) => {
                        setResumeFile(event.target.files?.[0] || null);
                        if (event.target.files?.[0]) setResumeUrl('');
                      }}
                    />
                  </label>
                  {resumeFile && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-gray-300">
                        <FileText size={16} className="shrink-0 text-red-400" />
                        <span className="truncate">{resumeFile.name}</span>
                        <span className="shrink-0 text-xs text-gray-600">{formatFileSize(resumeFile.size)}</span>
                      </div>
                      <button type="button" onClick={() => setResumeFile(null)} className="rounded-full p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-mono uppercase">Resume or portfolio URL</label>
                  <input
                    value={resumeUrl}
                    onChange={(e) => {
                      setResumeUrl(e.target.value);
                      if (e.target.value.trim()) setResumeFile(null);
                    }}
                    disabled={Boolean(resumeFile) || isOwnJob}
                    placeholder="https://"
                    className="w-full mt-2 border border-[#2a2a2a] bg-[#0f0f0f] text-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed rounded-2xl px-4 py-3 text-sm outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition"
                  />
                  <p className="mt-1 text-xs text-gray-600">Use either a document upload or a URL.</p>
                </div>
                {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
                {success && <p className="text-xs text-green-400 font-mono">{success}</p>}
                <button type="submit" disabled={isSubmitting || isOwnJob} className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-mono font-medium px-4 py-3 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting...' : 'Submit application'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
