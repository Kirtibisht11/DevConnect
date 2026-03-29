import { useState } from 'react';
import { Code, Image, Send } from 'lucide-react';
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the dev community..."
            rows={3}
            className="w-full resize-none text-sm text-gray-800 placeholder-gray-400 outline-none"
          />

          {/* Code block */}
          {showCode && (
            <div className="mt-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 mb-2 outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
              </select>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste your code here..."
                rows={4}
                className="w-full font-mono text-xs bg-gray-900 text-green-400 rounded-lg p-3 resize-none outline-none"
              />
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                onClick={() => setShowCode(!showCode)}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition ${showCode ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Code size={14} />
                Code
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-full transition disabled:opacity-50"
            >
              <Send size={14} />
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}