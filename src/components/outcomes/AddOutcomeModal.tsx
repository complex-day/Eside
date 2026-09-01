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
import { AlertCircle, Calendar, Compass, Loader2, PlusCircle, Sparkles, X } from "lucide-react";

interface AddOutcomeModalProps {
  experienceId: string;
  storyCreatedAt?: string;
  isOpen: boolean;
  onClose: () => void;
  onOutcomeAdded: (newOutcome: OutcomeItem) => void;
}

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

  // Compute elapsed days from story creation date (default to 0 if freshly created)
  const autoCalculatedDays = storyCreatedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(storyCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
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

  const onSubmit = async (data: CreateOutcomeInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload: CreateOutcomeInput = {
        content: data.content,
      };

      // Only send days_after if author specifically chose to override it
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
        setServerError(json.error?.message || "Failed to record journey update.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-lg border-border bg-surface-card shadow-2xl shadow-black/40">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-primary">
              <Compass className="h-4 w-4" />
              <CardTitle className="text-base font-bold">
                Add Journey Update
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Document what happened next, how your decisions played out, and what you learned.
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

            {/* Auto-Calculated Day Indicator & Retroactive Option */}
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      {isCustomDays && typeof customDaysValue === "number"
                        ? `Day ${customDaysValue} (Custom Offset)`
                        : `Day ${autoCalculatedDays} (Today)`}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {isCustomDays
                        ? "Documenting progress at a custom timeline checkpoint."
                        : `Automatically calculated from when this story was created.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCustomDays(!isCustomDays)}
                  className="text-[11px] text-primary hover:underline font-medium flex items-center space-x-1"
                >
                  <Calendar className="h-3 w-3" />
                  <span>{isCustomDays ? "Use Today" : "Custom Day"}</span>
                </button>
              </div>

              {isCustomDays && (
                <div className="pt-2 border-t border-primary/10">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="days_after" className="text-xs font-medium">
                      Days after story began:
                    </Label>
                    <Input
                      id="days_after"
                      type="number"
                      min={0}
                      max={3650}
                      placeholder="e.g. 14"
                      className="h-8 text-xs w-28 bg-background"
                      {...register("days_after", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.days_after && (
                    <p className="text-[11px] text-destructive mt-1">
                      {errors.days_after.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Outcome Narrative Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-xs font-semibold">
                  What Happened? <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {currentContent.length}/5,000
                </span>
              </div>
              <textarea
                id="content"
                rows={6}
                placeholder="Describe your progress, decisions made, obstacles faced, or breakthroughs achieved..."
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
                  Recording Journey Update...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Post Journey Update
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
