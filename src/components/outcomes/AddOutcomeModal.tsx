"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createOutcomeSchema,
  type CreateOutcomeInput,
} from "@/lib/validations/outcome";
import { type OutcomeItem } from "@/components/outcomes/OutcomeMilestoneCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Milestone, PlusCircle, X } from "lucide-react";

interface AddOutcomeModalProps {
  experienceId: string;
  isOpen: boolean;
  onClose: () => void;
  onOutcomeAdded: (newOutcome: OutcomeItem) => void;
}

const PRESET_DAYS = [
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "180 Days", value: 180 },
  { label: "1 Year", value: 365 },
];

export function AddOutcomeModal({
  experienceId,
  isOpen,
  onClose,
  onOutcomeAdded,
}: AddOutcomeModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomDays, setIsCustomDays] = useState(false);

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
      days_after: 30,
      content: "",
    },
  });

  const currentDays = watch("days_after");
  const currentContent = watch("content") || "";

  if (!isOpen) return null;

  const handleSelectPreset = (days: number) => {
    setIsCustomDays(false);
    setValue("days_after", days, { shouldValidate: true });
  };

  const handleSelectCustom = () => {
    setIsCustomDays(true);
  };

  const onSubmit = async (data: CreateOutcomeInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch(`/api/v1/experiences/${experienceId}/outcomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setServerError(json.error?.message || "Failed to record outcome milestone.");
        return;
      }

      onOutcomeAdded(json.data);
      reset();
      onClose();
    } catch {
      setServerError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-lg border-border bg-surface-card shadow-2xl shadow-black/40">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-primary">
              <Milestone className="h-4 w-4" />
              <CardTitle className="text-base font-bold">
                Log Follow-up Outcome Milestone
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Document what happened next, how the situation evolved, and lessons learned.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-4">
            {serverError && (
              <div className="flex items-start space-x-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Timeframe Quick Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Milestone Timeframe <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_DAYS.map((preset) => {
                  const isSelected = !isCustomDays && currentDays === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleSelectPreset(preset.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-surface-card text-muted-foreground border-border hover:bg-surface-elevated hover:text-foreground"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    isCustomDays
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-card text-muted-foreground border-border hover:bg-surface-elevated hover:text-foreground"
                  }`}
                >
                  Custom Days
                </button>
              </div>

              {isCustomDays && (
                <div className="pt-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={0}
                      max={3650}
                      placeholder="e.g. 45"
                      className="h-8 text-xs w-32"
                      {...register("days_after", { valueAsNumber: true })}
                    />
                    <span className="text-xs text-muted-foreground">days after story began</span>
                  </div>
                </div>
              )}

              {errors.days_after && (
                <p className="text-[11px] text-destructive">{errors.days_after.message}</p>
              )}
            </div>

            {/* Outcome Narrative Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-xs font-semibold">
                  Outcome Narrative & Learnings <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {currentContent.length}/5,000
                </span>
              </div>
              <textarea
                id="content"
                rows={6}
                placeholder="What happened during this timeframe? What decisions did you make, and how did it turn out?"
                className="w-full rounded-md border border-input bg-background p-3 text-xs sm:text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y leading-relaxed"
                maxLength={5000}
                {...register("content")}
              />
              {errors.content && (
                <p className="text-[11px] text-destructive">{errors.content.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end space-x-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Recording Milestone...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Log Outcome
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
