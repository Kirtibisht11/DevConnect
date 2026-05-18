import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
  Trash2,
  Edit3,
  X,
  Check
} from 'lucide-react';

import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuthStore();

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes_count) || 0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [commentsCount, setCommentsCount] = useState(
    Number(post.comments_count) || 0
  );

  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [currentContent, setCurrentContent] = useState(post.content);

  const [showMenu, setShowMenu] = useState(false);

  const isOwner = user?.id === post.user_id;

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

  const handleBookmark = async () => {
    try {
      const res = await api.post(`/bookmarks/${post.id}`);
      setBookmarked(res.data.bookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;

    try {
      await api.delete(`/posts/${post.id}`);
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) return;

    try {
      await api.put(`/posts/${post.id}`, {
        content: editContent
      });

      setCurrentContent(editContent);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#111111] rounded-xl border border-[#2a2a2a] p-4 hover:shadow-sm transition">

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">

        <Link to={`/profile/${post.user_id}`}>

          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold overflow-hidden">

            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              post.username?.[0]?.toUpperCase()
            )}
          </div>

        </Link>

        <div className="flex-1">

          <Link to={`/profile/${post.user_id}`}>

            <p className="font-semibold text-sm text-gray-100 hover:underline">
              {post.full_name || post.username}
            </p>

          </Link>

          <p className="text-xs text-gray-500">
            @{post.username} ·{' '}
            {formatDistanceToNow(
              new Date(post.created_at),
              { addSuffix: true }
            )}
          </p>
        </div>

        {/* Owner Menu */}
        {isOwner && (
          <div className="relative">

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-gray-400 p-1 rounded transition"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-lg z-10 w-36 py-1">

                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-[#1a1a1a] transition"
                >
                  <Edit3 size={14} />
                  Edit post
                </button>

                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-[#1a1a1a] transition"
                >
                  <Trash2 size={14} />
                  Delete post
                </button>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="mb-3">

          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            className="w-full border border-[#2a2a2a] bg-[#1a1a1a] text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
          />

          <div className="flex gap-2 mt-2">

            <button
              onClick={handleEditSave}
              className="flex items-center gap-1 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full hover:bg-red-600 transition"
            >
              <Check size={12} />
              Save
            </button>

            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(currentContent);
              }}
              className="flex items-center gap-1 border border-[#2a2a2a] text-gray-500 text-xs px-3 py-1.5 rounded-full hover:bg-[#1a1a1a] transition"
            >
              <X size={12} />
              Cancel
            </button>

          </div>
        </div>
      ) : (
        <p className="text-gray-200 text-sm leading-relaxed mb-3">
          {currentContent}
        </p>
      )}

      {/* Code Snippet */}
      {post.code_snippet && (
        <div className="rounded-lg overflow-hidden mb-3 text-sm">

          <SyntaxHighlighter
            language={post.language || 'javascript'}
            style={atomOneDark}
            customStyle={{
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px'
            }}
          >
            {post.code_snippet}
          </SyntaxHighlighter>

        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-[#2a2a2a]">

        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition ${
            liked
              ? 'text-red-500'
              : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart
            size={16}
            fill={liked ? 'currentColor' : 'none'}
          />

          <span>{likesCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 text-sm transition ${
            showComments
              ? 'text-red-400'
              : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <MessageCircle size={16} />

          <span>{commentsCount}</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 text-sm transition ${
            bookmarked
              ? 'text-red-400'
              : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <Bookmark
            size={16}
            fill={bookmarked ? 'currentColor' : 'none'}
          />
        </button>

        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-400 transition ml-auto">
          <Share2 size={16} />
        </button>

      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">

          <div className="flex gap-2 mb-4">

            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleAddComment()
              }
              placeholder="Write a comment..."
              className="flex-1 border border-[#2a2a2a] bg-[#1a1a1a] text-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20"
            />

            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || postingComment}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition disabled:opacity-50"
            >
              <Send size={14} />
            </button>

          </div>

          {loadingComments ? (
            <p className="text-sm text-gray-500 text-center py-2">
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="space-y-3">

              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">

                  <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">
                    {comment.username?.[0]?.toUpperCase()}
                  </div>

                  <div className="bg-[#1a1a1a] rounded-2xl px-3 py-2 flex-1 border border-[#2a2a2a]">

                    <p className="text-xs font-semibold text-gray-200">
                      {comment.full_name || comment.username}
                    </p>

                    <p className="text-sm text-gray-400 mt-0.5">
                      {comment.content}
                    </p>

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