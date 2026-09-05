"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExperienceSchema,
  type CreateExperienceInput,
  normalizeTag,
} from "@/lib/validations/experience";
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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Tag,
  HelpCircle,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function NewExperiencePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExperienceInput>({
    resolver: zodResolver(createExperienceSchema),
    defaultValues: {
      title: "",
      story: "",
      category_id: "",
      tags: [],
      status: "active",
    },
  });

  const storyValue = watch("story") || "";
  const titleValue = watch("title") || "";

  // Load platform categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/v1/categories");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
          if (json.data.length > 0) {
            setValue("category_id", json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setIsFetchingCategories(false);
      }
    }
    loadCategories();
  }, [setValue]);

  // Handle tag additions
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const normalized = normalizeTag(tagInput);
      if (normalized && normalized.length >= 2 && normalized.length <= 30) {
        if (!tags.includes(normalized) && tags.length < 5) {
          const updated = [...tags, normalized];
          setTags(updated);
          setValue("tags", updated);
        }
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    setValue("tags", updated);
  };

  const submitExperience = async (data: CreateExperienceInput, targetStatus: "active" | "hidden") => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/v1/experiences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: targetStatus,
          tags,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 401) {
          router.push("/login?next=/experiences/new");
          return;
        }
        setServerError(json.error?.message || "Failed to document decision. Please check your inputs.");
        return;
      }

      // Success: redirect to created experience or profile drafts
      if (targetStatus === "hidden") {
        router.push("/profile");
      } else {
        router.push(`/experiences/${json.data.id}`);
      }
      router.refresh();
    } catch {
      setServerError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Link
        href="/"
        className="inline-flex items-center text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Feed
      </Link>

      <Card className="glass-card shadow-lg border-white/[0.08]">
        <CardHeader className="space-y-1.5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/10 text-amber-200 border border-amber-100/15 text-sm">
              🌼
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-[#F1F5F9]">
                Start a Journey: Day 0 Baseline
              </CardTitle>
              <CardDescription className="text-xs text-[#94A3B8]">
                Establish the crossroads: the dilemma, choices evaluated, and initial actions taken.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={(e) => e.preventDefault()}>
          <CardContent className="space-y-4 pt-4">
            {serverError && (
              <div className="flex items-start space-x-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-xs font-semibold text-[#F1F5F9]">
                  Dilemma / Decision Title <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-[#64748B]">
                  {titleValue.length}/150
                </span>
              </div>
              <Input
                id="title"
                placeholder="e.g. Quit my corporate job at age 28 to start a solo engineering studio"
                className="h-9 text-xs sm:text-sm bg-black/60 border-white/[0.08] text-[#F1F5F9] focus:border-[#4DA3FF]/50"
                maxLength={150}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-[11px] text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="category_id" className="text-xs font-semibold text-[#F1F5F9]">
                Domain / Category <span className="text-destructive">*</span>
              </Label>
              {isFetchingCategories ? (
                <div className="h-9 rounded-md border border-white/[0.08] bg-black/40 animate-pulse" />
              ) : (
                <select
                  id="category_id"
                  className="w-full h-9 rounded-md border border-white/[0.08] bg-black/60 px-3 py-1 text-xs text-[#F1F5F9] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4DA3FF]"
                  {...register("category_id")}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#090B0F]">
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category_id && (
                <p className="text-[11px] text-destructive">{errors.category_id.message}</p>
              )}
            </div>

            {/* Story Narrative */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="story" className="text-xs font-semibold text-[#F1F5F9]">
                  Initial Decision Context &amp; Actions (Day 0) <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-[#64748B]">
                  {storyValue.length}/10,000
                </span>
              </div>
              <textarea
                id="story"
                rows={8}
                placeholder="Detail the situation: What was the dilemma? What choices did you evaluate? What plan or initial action did you commit to? (You will return later at Day 14, 30, or 90 to log follow-up milestones as outcomes unfold)."
                className="w-full rounded-md border border-white/[0.08] bg-black/60 p-3 text-xs sm:text-sm text-[#F1F5F9] shadow-sm placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4DA3FF] resize-y leading-relaxed"
                maxLength={10000}
                {...register("story")}
              />
              {errors.story && (
                <p className="text-[11px] text-destructive">{errors.story.message}</p>
              )}
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tags" className="text-xs font-semibold text-[#F1F5F9] flex items-center space-x-1">
                  <Tag className="h-3.5 w-3.5 text-[#64748B] mr-1" />
                  Tags <span className="text-[10px] text-[#64748B] font-normal">(Optional, max 5)</span>
                </Label>
                <span className="text-[10px] text-[#64748B]">
                  {tags.length}/5 tags
                </span>
              </div>

              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length >= 5 ? "Tag limit reached (max 5)" : "Type a tag and press Enter..."}
                disabled={tags.length >= 5}
                className="h-9 text-xs bg-black/60 border-white/[0.08] text-[#F1F5F9]"
              />

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-xs pl-2.5 pr-1.5 py-0.5 flex items-center space-x-1 bg-white/[0.05] text-[#CBD5E1] border border-white/[0.08]"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="rounded-full p-0.5 hover:bg-white/[0.1] text-[#94A3B8] hover:text-[#F1F5F9]"
                        aria-label={`Remove tag ${t}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymity Banner */}
            <div className="rounded-lg border border-white/[0.08] bg-black/40 p-3 flex items-start space-x-2.5">
              <HelpCircle className="h-4 w-4 text-[#4DA3FF] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Your journey is documented anonymously. Never include real full names, company confidential data, or private contact details.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => submitExperience(data, "hidden"))}
              className="w-full sm:w-auto h-9 text-xs font-medium border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.06]"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => submitExperience(data, "active"))}
              className="w-full sm:w-auto h-9 text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Publishing Journey...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Publish Day 0 Decision
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
