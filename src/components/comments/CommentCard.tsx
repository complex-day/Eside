"use client";

import { useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { Edit2, Trash2, Loader2, Clock, Check, X, Reply } from "lucide-react";

export interface CommentItem {
  id: string;
  experience_id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  is_author: boolean;
  is_story_author: boolean;
  created_at: string;
  updated_at: string;
}

interface CommentCardProps {
  comment: CommentItem;
  onCommentUpdated: (id: string, newContent: string, updatedAt: string) => void;
  onCommentDeleted: (id: string) => void;
  onReply?: (username: string) => void;
}

export function CommentCard({
  comment,
  onCommentUpdated,
  onCommentDeleted,
  onReply,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const relativeTime = formatRelativeTime(comment.created_at);
  const isEdited = comment.updated_at !== comment.created_at;

  const handleSaveEdit = async () => {
    if (editContent.trim().length < 2) {
      setEditError("Comment must be at least 2 characters.");
      return;
    }
    if (editContent.length > 1500) {
      setEditError("Comment cannot exceed 1500 characters.");
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/v1/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setEditError(json.error?.message || "Failed to update comment.");
        return;
      }

      onCommentUpdated(comment.id, json.data.content, json.data.updated_at);
      setIsEditing(false);
    } catch {
      setEditError("Failed to update comment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your comment?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/comments/${comment.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        onCommentDeleted(comment.id);
      }
    } catch {
      console.error("Failed to delete comment.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to highlight @username mentions with Blue Lotus badge
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@") && part.length > 1) {
        const username = part.slice(1);
        return (
          <Link
            key={index}
            href={`/u/${username}`}
            className="inline-flex items-center font-semibold text-[#4DA3FF] bg-[#4DA3FF]/10 hover:bg-[#4DA3FF]/20 px-1 py-0.2 rounded transition-colors"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <div className="rounded-xl glass-card p-3.5 sm:p-4 space-y-2.5 transition-all">
      {/* Header: Author Info & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <Link
            href={`/u/${comment.author.username}`}
            className="flex items-center space-x-1.5 shrink-0 group"
          >
            <UserAvatar username={comment.author.username} size="sm" />
            <span className="text-xs font-semibold text-[#F1F5F9] truncate max-w-[120px] sm:max-w-[200px] group-hover:text-[#4DA3FF] transition-colors">
              @{comment.author.username}
            </span>
          </Link>

          {comment.is_story_author && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 bg-[#4DA3FF]/10 text-[#4DA3FF] border-[#4DA3FF]/25 font-bold shrink-0"
            >
              Author
            </Badge>
          )}

          <span className="text-[#64748B] text-xs shrink-0">•</span>

          <div className="flex items-center space-x-1 text-[10px] text-[#94A3B8] tabular-nums shrink-0">
            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            <span>{relativeTime}</span>
            {isEdited && <span className="italic">(edited)</span>}
          </div>
        </div>

        {/* Comment Author Actions */}
        {comment.is_author && !isEditing && (
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => {
                setEditContent(comment.content);
                setIsEditing(true);
              }}
              className="rounded p-1 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.05] transition-colors"
              title="Edit comment"
              aria-label="Edit comment"
            >
              <Edit2 className="h-3 w-3" aria-hidden="true" />
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded p-1 text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete comment"
              aria-label="Delete comment"
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin text-rose-400" aria-hidden="true" />
              ) : (
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {isEditing ? (
        <div className="space-y-2 pt-1">
          {editError && (
            <p className="text-[11px] text-rose-400">{editError}</p>
          )}
          <textarea
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-md border border-white/[0.1] bg-black/60 p-2.5 text-xs text-[#F1F5F9] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4DA3FF] resize-y leading-relaxed"
            maxLength={1500}
          />
          <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
            <span className="font-mono tabular-nums">{editContent.length}/1,500</span>
            <div className="flex items-center space-x-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
                className="h-7 text-[11px] px-2 border-white/10 text-[#F1F5F9]"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving || editContent.trim().length < 2}
                onClick={handleSaveEdit}
                className="h-7 text-[11px] px-2 font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA]"
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-line">
            {renderFormattedContent(comment.content)}
          </p>

          {/* Reply Button */}
          {onReply && (
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onReply(comment.author.username)}
                className="inline-flex items-center space-x-1 text-[11px] font-medium text-[#94A3B8] hover:text-[#4DA3FF] transition-colors py-0.5 px-1.5 rounded hover:bg-white/[0.04]"
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
