"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCommentSchema,
  type CreateCommentInput,
} from "@/lib/validations/comment";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Send } from "lucide-react";

interface CommentInputProps {
  experienceId: string;
  isAuthenticated: boolean;
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
  onCommentSubmitted,
}: CommentInputProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
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

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border/80 bg-surface-card/60 p-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Sign in to ask questions, offer feedback, or share relevant perspectives.
        </p>
        <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
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
    } catch {
      setServerError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
      {serverError && (
        <div className="flex items-start space-x-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="space-y-1">
        <textarea
          rows={3}
          placeholder="Share constructive feedback or ask a clarifying question..."
          className="w-full rounded-lg border border-input bg-background p-3 text-xs sm:text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y leading-relaxed"
          maxLength={1500}
          {...register("content")}
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          {errors.content ? (
            <span className="text-destructive font-medium">{errors.content.message}</span>
          ) : (
            <span>Constructive and supportive remarks only.</span>
          )}
          <span>{contentValue.length}/1,500</span>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || contentValue.trim().length < 2}
          className="h-8 text-xs font-semibold px-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="mr-1.5 h-3 w-3" />
              Post Comment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
