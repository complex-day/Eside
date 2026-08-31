"use client";

import { useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { Edit2, Trash2, Loader2, Clock, Check, X } from "lucide-react";

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
}

export function CommentCard({
  comment,
  onCommentUpdated,
  onCommentDeleted,
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

  return (
    <div className="rounded-xl border border-border/70 bg-surface-card/80 p-4 space-y-2.5 transition-all hover:border-border">
      {/* Header: Author Info & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <Link
            href={`/u/${comment.author.username}`}
            className="flex items-center space-x-2 shrink-0 group"
          >
            <UserAvatar username={comment.author.username} size="sm" />
            <span className="text-xs font-semibold text-foreground truncate group-hover:underline">
              @{comment.author.username}
            </span>
          </Link>

          {comment.is_story_author && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-bold"
            >
              Author
            </Badge>
          )}

          <span className="text-muted-foreground/40 text-xs">•</span>

          <div className="flex items-center space-x-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>{relativeTime}</span>
            {isEdited && <span className="italic">(edited)</span>}
          </div>
        </div>

        {/* Comment Author Actions */}
        {comment.is_author && !isEditing && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setEditContent(comment.content);
                setIsEditing(true);
              }}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
              title="Edit comment"
              aria-label="Edit comment"
            >
              <Edit2 className="h-3 w-3" />
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete comment"
              aria-label="Delete comment"
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin text-destructive" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {isEditing ? (
        <div className="space-y-2 pt-1">
          {editError && (
            <p className="text-[11px] text-destructive">{editError}</p>
          )}
          <textarea
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y leading-relaxed"
            maxLength={1500}
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{editContent.length}/1,500</span>
            <div className="flex items-center space-x-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
                className="h-7 text-[11px] px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving || editContent.trim().length < 2}
                onClick={handleSaveEdit}
                className="h-7 text-[11px] px-2 font-semibold"
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
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
          {comment.content}
        </p>
      )}
    </div>
  );
}
