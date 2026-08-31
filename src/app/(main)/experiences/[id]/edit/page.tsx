"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateExperienceSchema,
  type UpdateExperienceInput,
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
  Save,
  Trash2,
  Tag,
  Edit3,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
}

interface EditExperiencePageProps {
  params: {
    id: string;
  };
}

export default function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = params;
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateExperienceInput>({
    resolver: zodResolver(updateExperienceSchema),
  });

  const storyValue = watch("story") || "";
  const titleValue = watch("title") || "";
  const statusValue = watch("status") || "active";

  // Load existing experience and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [expRes, catRes] = await Promise.all([
          fetch(`/api/v1/experiences/${id}`),
          fetch("/api/v1/categories"),
        ]);

        const expJson = await expRes.json();
        const catJson = await catRes.json();

        if (catJson.success && Array.isArray(catJson.data)) {
          setCategories(catJson.data);
        }

        if (!expRes.ok || !expJson.success) {
          setServerError(expJson.error?.message || "Failed to load experience.");
          setInitialLoading(false);
          return;
        }

        const data = expJson.data;
        if (!data.is_author) {
          router.push(`/experiences/${id}`);
          return;
        }

        reset({
          title: data.title,
          story: data.story,
          category_id: data.category.id,
          status: data.status,
        });

        if (Array.isArray(data.tags)) {
          setTags(data.tags);
        }
      } catch {
        setServerError("Failed to load experience details.");
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, [id, reset, router]);

  // Handle tag additions
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const normalized = normalizeTag(tagInput);
      if (normalized && normalized.length >= 2 && normalized.length <= 30) {
        if (!tags.includes(normalized) && tags.length < 5) {
          const updated = [...tags, normalized];
          setTags(updated);
        }
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
  };

  const onUpdate = async (data: UpdateExperienceInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch(`/api/v1/experiences/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tags,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setServerError(json.error?.message || "Failed to update experience.");
        return;
      }

      router.push(`/experiences/${id}`);
      router.refresh();
    } catch {
      setServerError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onArchive = async () => {
    setIsDeleting(true);
    setServerError(null);

    try {
      const res = await fetch(`/api/v1/experiences/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setServerError(json.error?.message || "Failed to archive experience.");
        setIsDeleting(false);
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setServerError("An unexpected network error occurred.");
      setIsDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading experience details...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Link
        href={`/experiences/${id}`}
        className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Cancel & Back to Experience
      </Link>

      <Card className="border-border bg-surface-card shadow-lg shadow-black/20">
        <CardHeader className="space-y-1.5 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  Edit Experience
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Update your narrative story, category, or publication status.
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Archive
            </Button>
          </div>
        </CardHeader>

        {showDeleteConfirm && (
          <div className="m-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs space-y-2">
            <div className="flex items-start space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-snug">
                Are you sure you want to archive this experience? It will be removed from the public feed and preserved as read-only in your profile archive.
              </p>
            </div>

            <div className="flex items-center space-x-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="h-7 text-xs px-2.5"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={onArchive}
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

        <form onSubmit={handleSubmit(onUpdate)}>
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
                placeholder="Experience Title"
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
                placeholder="Describe your situation in detail..."
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

            {/* Status Switcher (Published vs Draft) */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Publication Visibility</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("status", "active")}
                  className={`rounded-lg border p-3 text-left text-xs transition-all ${
                    statusValue === "active"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-surface-card text-muted-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <p className="font-semibold text-foreground">Published</p>
                  <p className="text-[11px] text-muted-foreground">Visible on public feeds and discovery.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("status", "hidden")}
                  className={`rounded-lg border p-3 text-left text-xs transition-all ${
                    statusValue === "hidden"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-surface-card text-muted-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <p className="font-semibold text-foreground">Draft (Private)</p>
                  <p className="text-[11px] text-muted-foreground">Saved privately in your profile dashboard.</p>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end space-x-2 pt-2 border-t border-border/40">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-9 text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
