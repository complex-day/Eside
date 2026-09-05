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
        setError(json.error?.message || "Failed to archive decision.");
        setIsDeleting(false);
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("An unexpected error occurred while archiving.");
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
          className="border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 rounded-lg text-xs hover:bg-white/[0.06] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        />

        {isAuthor && (
          <>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#CBD5E1] hover:text-[#F1F5F9] transition-colors rounded-lg"
            >
              <Link href={`/experiences/${experienceId}/edit`}>
                <Edit3 className="h-3.5 w-3.5 mr-1.5 text-[#4DA3FF]" />
                Edit Journey
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="h-8 px-3 text-xs border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Archive
            </Button>
          </>
        )}
      </div>

      {showConfirm && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs space-y-2.5">
          <div className="flex items-start space-x-2 text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-relaxed">
              Are you sure you want to archive this journey? It will be removed from public discovery and preserved as read-only in your profile archive.
            </p>
          </div>

          {error && <p className="text-rose-400 font-medium">{error}</p>}

          <div className="flex items-center space-x-2 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setShowConfirm(false)}
              className="h-7 text-xs px-2.5 border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-7 text-xs px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium"
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
