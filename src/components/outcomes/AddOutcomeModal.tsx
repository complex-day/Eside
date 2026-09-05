"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createOutcomeSchema,
  type CreateOutcomeInput,
} from "@/lib/validations/outcome";
import { type OutcomeItem } from "@/components/outcomes/OutcomeMilestoneCard";
import { calculateCalendarDaysDifference } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Calendar,
  Loader2,
  X,
  Send,
} from "lucide-react";

interface AddOutcomeModalProps {
  experienceId: string;
  storyCreatedAt?: string;
  isOpen: boolean;
  onClose: () => void;
  onOutcomeAdded: (newOutcome: OutcomeItem) => void;
}

export type OutcomeSubType = "validated" | "hard_lesson" | "unresolved";

const CHECKPOINT_TYPES = [
  {
    id: "update",
    name: "Progress Update",
    tag: "[Progress Update]",
    symbol: "🌻",
    description: "Ongoing execution, actions & momentum",
    color: "text-[#FFB800] border-[#FFB800]/30 bg-[#FFB800]/10",
  },
  {
    id: "learning",
    name: "Learning & Build",
    tag: "[Learning & Build]",
    symbol: "🪻",
    description: "New skill, engineering, knowledge acquired",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  {
    id: "turning_point",
    name: "Turning Point / Pivot",
    tag: "[Turning Point]",
    symbol: "🍁",
    description: "Setback, obstacle, strategy shift or failure",
    color: "text-[#FF6B35] border-[#FF6B35]/30 bg-[#FF6B35]/10",
  },
  {
    id: "outcome",
    name: "Resolved Outcome",
    tag: "[Resolved Outcome]",
    symbol: "🪷",
    description: "Where this journey landed — good, bad, or unclear",
    color: "text-[#4DA3FF] border-[#4DA3FF]/30 bg-[#4DA3FF]/15",
  },
];

const OUTCOME_SUB_TYPES = [
  {
    id: "validated",
    name: "Validated Outcome",
    tag: "[Validated Outcome]",
    symbol: "🪷",
    description: "Goal reached, positive result, or hypothesis proven",
    activeClass: "bg-[#4DA3FF]/15 border-[#4DA3FF]/60 ring-1 ring-[#4DA3FF]/30",
  },
  {
    id: "hard_lesson",
    name: "Hard Lesson",
    tag: "[Hard Lesson]",
    symbol: "🍂",
    description: "Ended negatively or failed — sharing takeaways & warnings",
    activeClass: "bg-[#C88A58]/15 border-[#C88A58]/60 ring-1 ring-[#C88A58]/30",
  },
  {
    id: "unresolved",
    name: "Verdict Unclear",
    tag: "[Unresolved]",
    symbol: "⏳",
    description: "Ended or paused with mixed results; no clean conclusion",
    activeClass: "bg-slate-500/15 border-slate-400/60 ring-1 ring-slate-400/30",
  },
];

export function AddOutcomeModal({
  experienceId,
  storyCreatedAt,
  isOpen,
  onClose,
  onOutcomeAdded,
}: AddOutcomeModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [selectedType, setSelectedType] = useState<string>("update");
  const [outcomeSubType, setOutcomeSubType] = useState<OutcomeSubType>("validated");

  const autoCalculatedDays = storyCreatedAt
    ? calculateCalendarDaysDifference(storyCreatedAt)
    : 0;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateOutcomeInput>({
    resolver: zodResolver(createOutcomeSchema),
    defaultValues: {
      days_after: undefined,
      content: "",
    },
  });

  const customDaysValue = watch("days_after");
  const currentContent = watch("content") || "";

  if (!isOpen) return null;

  const handleToggleCustomDays = (enabled: boolean) => {
    setIsCustomDays(enabled);
    if (!enabled) {
      setValue("days_after", undefined, { shouldValidate: true });
    } else {
      setValue("days_after", autoCalculatedDays, { shouldValidate: true });
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const onSubmit = async (data: CreateOutcomeInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      let tagPrefix = "";
      if (selectedType === "outcome") {
        const subObj = OUTCOME_SUB_TYPES.find((s) => s.id === outcomeSubType);
        tagPrefix = subObj ? `${subObj.tag}: ` : "[Validated Outcome]: ";
      } else {
        const typeObj = CHECKPOINT_TYPES.find((t) => t.id === selectedType);
        tagPrefix = typeObj ? `${typeObj.tag}: ` : "";
      }

      // Clean previous tag if user edited it
      const cleanBody = data.content.replace(/^\[.*?\]:\s*/, "");
      const formattedContent = `${tagPrefix}${cleanBody}`;

      const payload: CreateOutcomeInput = {
        content: formattedContent,
      };

      if (isCustomDays && typeof data.days_after === "number") {
        payload.days_after = data.days_after;
      }

      const response = await fetch(`/api/v1/experiences/${experienceId}/outcomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setServerError(json.error?.message || "Failed to record outcome checkpoint.");
        return;
      }

      onOutcomeAdded(json.data);
      reset();
      setIsCustomDays(false);
      onClose();
    } catch {
      setServerError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedDay =
    isCustomDays && typeof customDaysValue === "number"
      ? customDaysValue
      : autoCalculatedDays;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl glass-card bg-[#090B0F]/95 text-[#F1F5F9] p-5 sm:p-7 shadow-2xl relative space-y-4 border-white/[0.08]">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-[#93C5FD] border border-white/[0.08]">
                Day {displayedDay} Checkpoint
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] pt-1">
              Add Timeline Milestone or Outcome
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.05] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.1] transition-colors border border-white/[0.08]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Meaningful Checkpoint Stage Selector */}
          <div className="space-y-2">
            <label className="text-xs text-[#94A3B8] font-medium">
              Choose Checkpoint Stage
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHECKPOINT_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeSelect(type.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-white/[0.08] border-[#4DA3FF]/60 ring-1 ring-[#4DA3FF]/40"
                        : "bg-black/40 border-white/[0.06] hover:bg-white/[0.03] text-[#94A3B8]"
                    }`}
                  >
                    <span className="text-base leading-none shrink-0 mt-0.5" aria-hidden="true">
                      {type.symbol}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F1F5F9] flex items-center gap-1.5">
                        <span>{type.name}</span>
                      </div>
                      <div className="text-[11px] text-[#94A3B8] leading-tight mt-0.5">
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nested Sub-Choice Picker for Terminal Outcome States */}
            {selectedType === "outcome" && (
              <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <span className="text-[11px] font-semibold text-[#CBD5E1]">
                    Outcome Nature / Verdict:
                  </span>
                  <span className="text-[10px] text-[#64748B]">Terminal Conclusion</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {OUTCOME_SUB_TYPES.map((sub) => {
                    const isSubSelected = outcomeSubType === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setOutcomeSubType(sub.id as OutcomeSubType)}
                        className={`flex flex-col gap-1 p-2.5 rounded-lg border text-left transition-all ${
                          isSubSelected
                            ? sub.activeClass
                            : "bg-black/40 border-white/[0.06] hover:bg-white/[0.03] text-[#94A3B8]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9]">
                          <span>{sub.symbol}</span>
                          <span className="truncate">{sub.name}</span>
                        </div>
                        <p className="text-[10px] text-[#94A3B8] leading-tight">
                          {sub.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Custom Day Toggle */}
          <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-[#93C5FD] border border-white/[0.08]">
                Day {displayedDay}
              </span>
              <span className="text-xs text-[#94A3B8]">
                {isCustomDays ? "Custom retroactive day" : "Calculated from start date"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleCustomDays(!isCustomDays)}
              className="text-xs text-[#4DA3FF] hover:text-[#7DD3FC] flex items-center gap-1 font-medium transition-colors"
            >
              <Calendar className="h-3 w-3" />
              <span>{isCustomDays ? "Use Today" : "Change Day"}</span>
            </button>
          </div>

          {isCustomDays && (
            <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-lg border border-white/[0.06]">
              <Label htmlFor="days_after" className="text-xs text-[#94A3B8]">
                Days after decision began:
              </Label>
              <Input
                id="days_after"
                type="number"
                min={0}
                max={3650}
                className="h-8 w-24 bg-black/60 border-white/[0.08] text-xs font-mono text-[#F1F5F9]"
                {...register("days_after", { valueAsNumber: true })}
              />
            </div>
          )}

          {/* Update Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-xs text-[#94A3B8] font-medium">
                Milestone Details <span className="text-rose-400">*</span>
              </Label>
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeTab === "write"
                      ? "bg-white/[0.08] text-[#F1F5F9]"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-white/[0.08] text-[#F1F5F9]"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {activeTab === "write" ? (
              <textarea
                id="content"
                rows={5}
                placeholder="What happened? Describe the progress, setback, pivot, or final results (Minimum 10 characters)..."
                className="w-full rounded-lg border border-white/[0.08] bg-black/60 p-3 text-xs sm:text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#4DA3FF]/50 resize-y leading-relaxed"
                maxLength={5000}
                {...register("content")}
              />
            ) : (
              <div className="w-full min-h-[120px] rounded-lg border border-white/[0.08] bg-black/60 p-3 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                {currentContent || "No content entered yet."}
              </div>
            )}

            {errors.content && (
              <p className="text-[11px] text-rose-400">{errors.content.message}</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs border-white/10 bg-white/[0.03] text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F1F5F9]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA] shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Record Milestone
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
