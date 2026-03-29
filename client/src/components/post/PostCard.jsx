import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import api from '../../api/axios';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export default function PostCard({ post, onUpdate }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes_count) || 0);

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      if (res.data.liked) {
        setLikesCount(prev => prev + 1);
        setLiked(true);
      } else {
        setLikesCount(prev => prev - 1);
        setLiked(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
          {post.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">
            {post.full_name || post.username}
          </p>
          <p className="text-xs text-gray-400">
            @{post.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-800 text-sm leading-relaxed mb-3">{post.content}</p>

      {/* Code snippet */}
      {post.code_snippet && (
        <div className="rounded-lg overflow-hidden mb-3 text-sm">
          <SyntaxHighlighter
            language={post.language || 'javascript'}
            style={atomOneDark}
            customStyle={{ borderRadius: '8px', padding: '12px', fontSize: '13px' }}
          >
            {post.code_snippet}
          </SyntaxHighlighter>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition">
          <MessageCircle size={16} />
          <span>{post.comments_count || 0}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition">
          <Bookmark size={16} />
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition ml-auto">
          <Share2 size={16} />
        </button>
      </div>

    </div>
  );
}