"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  ArrowRight,
  Edit2,
  Trash2,
  Loader2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

export interface OutcomeItem {
  id: string;
  experience_id: string;
  days_after: number;
  content: string;
  created_at: string;
}

interface OutcomeMilestoneCardProps {
  outcome: OutcomeItem;
  experienceId: string;
  isAuthor?: boolean;
  deltaDays?: number;
  isLatest?: boolean;
  onOutcomeUpdated?: (updated: OutcomeItem) => void;
  onOutcomeDeleted?: (id: string) => void;
}

export type CheckpointType =
  | "update"
  | "learning"
  | "turning_point"
  | "outcome_validated"
  | "outcome_lesson"
  | "outcome_unresolved";

const CHECKPOINT_TYPES = [
  {
    id: "update",
    name: "Progress Update",
    tag: "[Progress Update]",
    symbol: "🌻",
  },
  {
    id: "learning",
    name: "Learning & Build",
    tag: "[Learning & Build]",
    symbol: "🪻",
  },
  {
    id: "turning_point",
    name: "Turning Point",
    tag: "[Turning Point]",
    symbol: "🍁",
  },
  {
    id: "outcome_validated",
    name: "Validated",
    tag: "[Validated Outcome]",
    symbol: "🪷",
  },
  {
    id: "outcome_lesson",
    name: "Hard Lesson",
    tag: "[Hard Lesson]",
    symbol: "🍂",
  },
  {
    id: "outcome_unresolved",
    name: "Verdict Unclear",
    tag: "[Unresolved]",
    symbol: "⏳",
  },
];

export function OutcomeMilestoneCard({
  outcome,
  experienceId,
  isAuthor = false,
  deltaDays,
  onOutcomeUpdated,
  onOutcomeDeleted,
}: OutcomeMilestoneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDaysAfter, setEditDaysAfter] = useState(outcome.days_after);
  const [editContent, setEditContent] = useState(
    outcome.content.replace(/^\[.*?\]:\s*/, "")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawContent = outcome.content;
  const textLower = rawContent.toLowerCase();

  // Robust classification into the milestone and terminal outcome stages
  let eventType: CheckpointType = "update";

  if (
    textLower.includes("[hard lesson") ||
    textLower.includes("[cautionary") ||
    textLower.includes("cautionary tale") ||
    textLower.includes("hard lesson") ||
    textLower.includes("shut down") ||
    textLower.includes("closed down") ||
    textLower.includes("bankrupt") ||
    textLower.includes("went to zero") ||
    textLower.includes("total failure") ||
    textLower.includes("disastrous")
  ) {
    eventType = "outcome_lesson";
  } else if (
    textLower.includes("[unresolved") ||
    textLower.includes("[verdict unclear") ||
    textLower.includes("verdict unclear") ||
    textLower.includes("inconclusive") ||
    textLower.includes("mixed results")
  ) {
    eventType = "outcome_unresolved";
  } else if (
    textLower.includes("[validated outcome") ||
    textLower.includes("[outcome") ||
    textLower.includes("[final outcome") ||
    textLower.includes("[resolved outcome") ||
    textLower.includes("outcome:") ||
    textLower.includes("achieved") ||
    textLower.includes("launched") ||
    textLower.includes("concluded") ||
    textLower.includes("succeeded") ||
    textLower.includes("won") ||
    textLower.includes("hired")
  ) {
    eventType = "outcome_validated";
  } else if (
    textLower.includes("[turning point") ||
    textLower.includes("[obstacle") ||
    textLower.includes("[pivot") ||
    textLower.includes("obstacle") ||
    textLower.includes("pivot") ||
    textLower.includes("struggle") ||
    textLower.includes("disappointing") ||
    textLower.includes("blocked") ||
    textLower.includes("giving up") ||
    textLower.includes("changing strategy") ||
    textLower.includes("setback")
  ) {
    eventType = "turning_point";
  } else if (
    textLower.includes("[learning") ||
    textLower.includes("[deep build") ||
    textLower.includes("learned") ||
    textLower.includes("need to learn") ||
    textLower.includes("study") ||
    textLower.includes("built") ||
    textLower.includes("insight") ||
    textLower.includes("discovered")
  ) {
    eventType = "learning";
  } else {
    eventType = "update";
  }

  const [selectedType, setSelectedType] = useState<CheckpointType>(eventType);

  const eventConfig = {
    update: {
      label: "Progress Update",
      symbol: "🌻",
      badgeClass: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/25",
      nodeBorder: "border-[#FFB800]/50 text-[#FFB800] bg-[#050505]",
      glowStyle: "",
    },
    learning: {
      label: "Learning & Build",
      symbol: "🪻",
      badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/25",
      nodeBorder: "border-blue-500/50 text-blue-400 bg-[#050505]",
      glowStyle: "",
    },
    turning_point: {
      label: "Turning Point / Pivot",
      symbol: "🍁",
      badgeClass: "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30",
      nodeBorder: "border-[#FF6B35]/70 text-[#FF6B35] bg-[#050505]",
      glowStyle: "",
    },
    outcome_validated: {
      label: "Validated Outcome",
      symbol: "🪷",
      badgeClass: "bg-[#4DA3FF]/15 text-[#4DA3FF] border-[#4DA3FF]/30",
      nodeBorder: "border-[#4DA3FF] text-[#4DA3FF] bg-[#050505]",
      glowStyle: "border-[#4DA3FF]/30 bg-[#4DA3FF]/[0.02]",
    },
    outcome_lesson: {
      label: "Hard Lesson / Cautionary Tale",
      symbol: "🍂",
      badgeClass: "bg-[#C88A58]/15 text-[#C88A58] border-[#C88A58]/30",
      nodeBorder: "border-[#C88A58] text-[#C88A58] bg-[#050505]",
      glowStyle: "border-[#C88A58]/30 bg-[#C88A58]/[0.02]",
    },
    outcome_unresolved: {
      label: "Verdict Unclear",
      symbol: "⏳",
      badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      nodeBorder: "border-slate-400 text-slate-300 bg-[#050505]",
      glowStyle: "border-slate-500/20 bg-slate-500/[0.02]",
    },
  }[eventType];

  const relativeTime = formatRelativeTime(outcome.created_at);
  const displayNarrative = rawContent.replace(/^\[.*?\]:\s*/, "");

  const formatDelta = (delta: number) => {
    if (delta === 0) return "Same day";
    if (delta === 1) return "+1d";
    if (delta < 14) return `+${delta}d`;
    if (delta < 60) return `+${Math.floor(delta / 7)}w`;
    return `+${Math.floor(delta / 30)}mo`;
  };

  const handleSaveEdit = async () => {
    if (editContent.trim().length < 5) {
      setError("Milestone description must be at least 5 characters.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const typeObj = CHECKPOINT_TYPES.find((t) => t.id === selectedType);
      const tagPrefix = typeObj ? `${typeObj.tag}: ` : "";
      const formattedContent = `${tagPrefix}${editContent.trim()}`;

      const res = await fetch(`/api/v1/experiences/${experienceId}/outcomes/${outcome.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: formattedContent,
          days_after: editDaysAfter,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to update milestone.");
        return;
      }

      if (onOutcomeUpdated) {
        onOutcomeUpdated(json.data);
      }
      setIsEditing(false);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this milestone update?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/experiences/${experienceId}/outcomes/${outcome.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (onOutcomeDeleted) {
          onOutcomeDeleted(outcome.id);
        }
      }
    } catch {
      console.error("Failed to delete outcome milestone.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 pb-4 group last:pb-2">
      {/* Node Marker on Timeline: Shows meaningful botanical symbol */}
      <div
        className={`absolute -left-3 sm:-left-3.5 top-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 transition-transform duration-200 group-hover:scale-110 ${eventConfig.nodeBorder}`}
        title={`${eventConfig.label} (${eventConfig.symbol})`}
      >
        <span className="text-[11px] sm:text-xs leading-none select-none" aria-hidden="true">
          {eventConfig.symbol}
        </span>
      </div>

      {/* Milestone Card */}
      <div className={`rounded-xl glass-card glass-card-hover p-4 sm:p-5 space-y-2.5 ${eventConfig.glowStyle}`}>
        {/* Card Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.05] text-[#F1F5F9] border border-white/[0.08]">
              Day {outcome.days_after}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${eventConfig.badgeClass}`}>
              <span className="text-[11px]">{eventConfig.symbol}</span>
              <span>{eventConfig.label}</span>
            </span>

            {typeof deltaDays === "number" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.06]">
                <ArrowRight className="h-2.5 w-2.5 text-[#4DA3FF]" />
                <span>{formatDelta(deltaDays)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <Clock className="h-3 w-3" />
              <span>{relativeTime}</span>
            </div>

            {/* Author Edit & Delete Actions */}
            {isAuthor && !isEditing && (
              <div className="flex items-center gap-1 ml-2 border-l border-white/[0.08] pl-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(displayNarrative);
                    setEditDaysAfter(outcome.days_after);
                    setSelectedType(eventType);
                    setIsEditing(true);
                  }}
                  className="rounded p-1 text-[#94A3B8] hover:text-[#4DA3FF] hover:bg-white/[0.05] transition-colors"
                  title="Edit milestone"
                  aria-label="Edit milestone"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded p-1 text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete milestone"
                  aria-label="Delete milestone"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Narrative or Inline Edit Mode */}
        {isEditing ? (
          <div className="space-y-3 pt-1">
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Checkpoint Type Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#94A3B8] font-medium">Stage Type:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {CHECKPOINT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id as CheckpointType)}
                    className={`px-2 py-1 rounded-lg text-xs border flex items-center justify-center gap-1 transition-all ${
                      selectedType === t.id
                        ? "bg-[#4DA3FF] text-black border-transparent font-semibold"
                        : "bg-black/40 text-[#94A3B8] border-white/[0.08] hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{t.symbol}</span>
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Input */}
            <div className="flex items-center gap-2">
              <label htmlFor={`day-${outcome.id}`} className="text-xs text-[#94A3B8]">
                Day number:
              </label>
              <Input
                id={`day-${outcome.id}`}
                type="number"
                min={0}
                max={3650}
                value={editDaysAfter}
                onChange={(e) => setEditDaysAfter(parseInt(e.target.value || "0", 10))}
                className="h-7 w-20 bg-black/60 border-white/[0.08] text-xs font-mono text-[#F1F5F9]"
              />
            </div>

            {/* Content Textarea */}
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-black/60 p-3 text-xs sm:text-sm text-[#F1F5F9] focus:outline-none focus:border-[#4DA3FF] resize-y leading-relaxed"
              placeholder="Describe this milestone checkpoint..."
              maxLength={5000}
            />

            {/* Save & Cancel Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.06]"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving || editContent.trim().length < 5}
                onClick={handleSaveEdit}
                className="h-7 text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Save Update
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-line">
            {displayNarrative}
          </p>
        )}
      </div>
    </div>
  );
}
