import { Heart, MessageCircle, Bookmark, Share2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import api from '../../api/axios';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export default function PostCard({ post, onUpdate }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes_count) || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsCount, setCommentsCount] = useState(Number(post.comments_count) || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

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

  const handleToggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/posts/${post.id}/comments`);
        setComments(res.data.comments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, {
        content: newComment
      });
      setComments(prev => [...prev, res.data.comment]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
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
        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 text-sm transition ${showComments ? 'text-indigo-500' : 'text-gray-400 hover:text-indigo-500'}`}
        >
          <MessageCircle size={16} />
          <span>{commentsCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition">
          <Bookmark size={16} />
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition ml-auto">
          <Share2 size={16} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || postingComment}
              className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>

          {loadingComments ? (
            <p className="text-sm text-gray-400 text-center py-2">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                    {comment.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-3 py-2 flex-1">
                    <p className="text-xs font-semibold text-gray-800">
                      {comment.full_name || comment.username}
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}