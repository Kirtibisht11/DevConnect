import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Terminal } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await register(form.username, form.email, form.password);
    if (result.success) navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code2 size={32} className="text-red-500" />
            <span className="text-3xl font-bold text-white">Dev<span className="text-red-500">Connect</span></span>
          </div>
          <p className="text-gray-500 text-sm font-mono">// join the developer community</p>
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#2a2a2a]">
            <Terminal size={14} className="text-red-500" />
            <span className="text-xs text-gray-500 font-mono">auth.register()</span>
            <div className="ml-auto flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm font-mono">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'username', name: 'username', type: 'text', placeholder: 'devuser123' },
              { label: 'email_address', name: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'password', name: 'password', type: 'password', placeholder: '••••••••' },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-mono text-gray-500 mb-1.5">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition font-mono"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 font-mono text-sm"
            >
              {isLoading ? '// creating account...' : '$ register --new-user'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6 font-mono">
            // already a dev?{' '}
            <Link to="/login" className="text-red-400 hover:text-red-300 transition">
              login()
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}