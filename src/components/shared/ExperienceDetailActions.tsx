"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, Loader2, AlertCircle } from "lucide-react";

interface ExperienceDetailActionsProps {
  experienceId: string;
  isAuthor: boolean;
  isBookmarked: boolean;
}

export function ExperienceDetailActions({
  experienceId,
  isAuthor,
  isBookmarked,
}: ExperienceDetailActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/experiences/${experienceId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to archive experience.");
        setIsDeleting(false);
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("An unexpected error occurred while deleting.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <BookmarkButton
          experienceId={experienceId}
          initialBookmarked={isBookmarked}
          showText
          className="border border-border bg-surface-card px-3 py-1.5 rounded-lg text-xs"
        />

        {isAuthor && (
          <>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-border bg-surface-card hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
            >
              <Link href={`/experiences/${experienceId}/edit`}>
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="h-8 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Archive
            </Button>
          </>
        )}
      </div>

      {showConfirm && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs space-y-2">
          <div className="flex items-start space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Are you sure you want to archive this experience? It will be removed from the public feed and preserved as read-only in your profile archive.
            </p>
          </div>

          {error && <p className="text-destructive font-medium">{error}</p>}

          <div className="flex items-center space-x-2 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setShowConfirm(false)}
              className="h-7 text-xs px-2.5"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-7 text-xs px-2.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Archiving...
                </>
              ) : (
                "Confirm Archive"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
