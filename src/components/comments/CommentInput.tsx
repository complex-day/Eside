"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCommentSchema,
  type CreateCommentInput,
} from "@/lib/validations/comment";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Send, X, Reply } from "lucide-react";

interface CommentInputProps {
  experienceId: string;
  isAuthenticated: boolean;
  replyToUsername?: string | null;
  onCancelReply?: () => void;
  onCommentSubmitted: (newComment: {
    id: string;
    experience_id: string;
    content: string;
    author: { id: string; username: string; avatar_url: string | null };
    is_author: boolean;
    is_story_author: boolean;
    created_at: string;
    updated_at: string;
  }) => void;
}

export function CommentInput({
  experienceId,
  isAuthenticated,
  replyToUsername,
  onCancelReply,
  onCommentSubmitted,
}: CommentInputProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: "",
    },
  });

  const contentValue = watch("content") || "";

  // When replyToUsername changes, insert @username and focus
  useEffect(() => {
    if (replyToUsername) {
      setValue("content", `@${replyToUsername} `);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [replyToUsername, setValue]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-2">
        <p className="text-xs text-slate-400">
          Sign in to ask questions, offer feedback, or share relevant perspectives on this decision.
        </p>
        <Button asChild size="sm" variant="outline" className="text-xs font-semibold border-slate-800 bg-slate-900 text-slate-300">
          <Link href={`/login?next=/experiences/${experienceId}`}>
            Sign In to Join Discussion
          </Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: CreateCommentInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch(`/api/v1/experiences/${experienceId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setServerError(json.error?.message || "Failed to post comment.");
        return;
      }

      onCommentSubmitted(json.data);
      reset();
      if (onCancelReply) onCancelReply();
    } catch {
      setServerError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { ref: formRef, ...restRegister } = register("content");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
      {/* Replying To Banner */}
      {replyToUsername && (
        <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary">
          <div className="flex items-center space-x-1.5 font-medium">
            <Reply className="h-3.5 w-3.5" />
            <span>Replying to <strong>@{replyToUsername}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => {
              setValue("content", "");
              if (onCancelReply) onCancelReply();
            }}
            className="text-primary hover:text-primary/70 p-0.5 rounded"
            title="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {serverError && (
        <div className="flex items-start space-x-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="space-y-1">
        <textarea
          rows={3}
          placeholder="Share constructive feedback or ask a clarifying question about this outcome…"
          className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs sm:text-sm text-slate-200 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y leading-relaxed"
          maxLength={1500}
          {...restRegister}
          ref={(e) => {
            formRef(e);
            textareaRef.current = e;
          }}
        />
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          {errors.content ? (
            <span className="text-destructive font-medium">{errors.content.message}</span>
          ) : (
            <span>Constructive and respectful discussions only.</span>
          )}
          <span className="font-mono tabular-nums">{contentValue.length}/1,500</span>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2">
        {replyToUsername && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setValue("content", "");
              if (onCancelReply) onCancelReply();
            }}
            className="h-8 text-xs text-slate-400 hover:text-slate-200 px-2.5"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || contentValue.trim().length < 2}
          className="h-8 text-xs font-semibold px-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Posting…
            </>
          ) : (
            <>
              <Send className="mr-1.5 h-3 w-3" aria-hidden="true" />
              {replyToUsername ? "Post Reply" : "Post Feedback"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
