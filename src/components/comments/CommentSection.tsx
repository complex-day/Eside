"use client";

import { useState, useRef } from "react";
import { CommentCard, type CommentItem } from "@/components/comments/CommentCard";
import { CommentInput } from "@/components/comments/CommentInput";
import { MessageSquare } from "lucide-react";

interface CommentSectionProps {
  experienceId: string;
  initialComments: CommentItem[];
  isAuthenticated: boolean;
}

export function CommentSection({
  experienceId,
  initialComments,
  isAuthenticated,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputSectionRef = useRef<HTMLDivElement | null>(null);

  const handleCommentSubmitted = (newComment: CommentItem) => {
    setComments((prev) => [...prev, newComment]);
    setReplyingTo(null);
  };

  const handleCommentUpdated = (id: string, newContent: string, updatedAt: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: newContent, updated_at: updatedAt } : c))
    );
  };

  const handleCommentDeleted = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReplyClick = (username: string) => {
    setReplyingTo(username);
    if (inputSectionRef.current) {
      inputSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section className="space-y-4 pt-4 border-t border-slate-800">
      {/* Header with Comments Count */}
      <div className="flex items-center space-x-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MessageSquare className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold tracking-tight text-slate-100">
          Community Feedback & Perspectives ({comments.length})
        </h2>
      </div>

      {/* Comment Input Box */}
      <div ref={inputSectionRef}>
        <CommentInput
          experienceId={experienceId}
          isAuthenticated={isAuthenticated}
          replyToUsername={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onCommentSubmitted={handleCommentSubmitted}
        />
      </div>

      {/* List of Comments */}
      {comments.length > 0 ? (
        <div className="space-y-3 pt-2">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onReply={handleReplyClick}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
          <p className="text-xs text-slate-400">
            No feedback posted yet. Ask a question or share how a similar decision played out for you!
          </p>
        </div>
      )}
    </section>
  );
}
