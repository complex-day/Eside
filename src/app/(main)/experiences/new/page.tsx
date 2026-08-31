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
  Send,
  FileText,
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
        setServerError(json.error?.message || "Failed to submit experience. Please check your inputs.");
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
        className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Feed
      </Link>

      <Card className="border-border bg-surface-card shadow-lg shadow-black/20">
        <CardHeader className="space-y-1.5 pb-4 border-b border-border/40">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
                Share a Lived Experience
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Document what happened, actions taken, lessons learned, and the outcome.
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
                <Label htmlFor="title" className="text-xs font-semibold">
                  Experience Title <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {titleValue.length}/150
                </span>
              </div>
              <Input
                id="title"
                placeholder="e.g. Failed my first college semester and recovered"
                className="h-9 text-xs sm:text-sm"
                maxLength={150}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-[11px] text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="category_id" className="text-xs font-semibold">
                Topic Category <span className="text-destructive">*</span>
              </Label>
              {isFetchingCategories ? (
                <div className="h-9 rounded-md border border-input bg-surface-elevated animate-pulse" />
              ) : (
                <select
                  id="category_id"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register("category_id")}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
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
                <Label htmlFor="story" className="text-xs font-semibold">
                  Story Narrative <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {storyValue.length}/10,000
                </span>
              </div>
              <textarea
                id="story"
                rows={8}
                placeholder="Describe your situation in detail: What was the initial event or mistake? What choices did you make? What actions worked or failed? (Minimum 10 characters)"
                className="w-full rounded-md border border-input bg-background p-3 text-xs sm:text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y leading-relaxed"
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
                <Label htmlFor="tags" className="text-xs font-semibold flex items-center space-x-1">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  Tags <span className="text-[10px] text-muted-foreground font-normal">(Optional, max 5)</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {tags.length}/5 tags
                </span>
              </div>

              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length >= 5 ? "Tag limit reached (max 5)" : "Type a tag and press Enter or comma..."}
                disabled={tags.length >= 5}
                className="h-9 text-xs"
              />

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-xs pl-2.5 pr-1.5 py-0.5 flex items-center space-x-1 bg-secondary text-secondary-foreground"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="rounded-full p-0.5 hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
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
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start space-x-2.5">
              <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your experience will be published under your anonymous pseudonym. Never include real names, addresses, or private sensitive contact information.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => submitExperience(data, "hidden"))}
              className="w-full sm:w-auto h-9 text-xs font-medium"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => submitExperience(data, "active"))}
              className="w-full sm:w-auto h-9 text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Publish Experience
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
