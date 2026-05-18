import { useState } from 'react';
import { Code, Send } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      await api.post('/posts', {
        content,
        code_snippet: showCode ? codeSnippet : null,
        language: showCode ? language : null,
      });
      setContent('');
      setCodeSnippet('');
      setShowCode(false);
      onPostCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="// share something with the dev community..."
            rows={3}
            className="w-full resize-none text-sm text-gray-300 placeholder-gray-600 outline-none bg-transparent font-mono"
          />

          {showCode && (
            <div className="mt-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded px-2 py-1 mb-2 outline-none"
              >
                {['javascript', 'python', 'java', 'cpp', 'sql', 'bash', 'typescript', 'rust', 'go'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// paste your code here..."
                rows={4}
                className="w-full font-mono text-xs bg-[#0a0a0a] border border-[#2a2a2a] text-green-400 rounded-lg p-3 resize-none outline-none focus:border-red-500/30"
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
            <button
              onClick={() => setShowCode(!showCode)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition font-mono ${
                showCode ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'text-gray-500 hover:bg-[#1a1a1a] border border-transparent'
              }`}
            >
              <Code size={13} />
              {showCode ? '// code attached' : '&lt;/&gt; add code'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1.5 rounded-full transition disabled:opacity-40 font-mono"
            >
              <Send size={13} />
              {isLoading ? 'posting...' : '$ post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}