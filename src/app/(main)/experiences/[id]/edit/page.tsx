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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Save,
  Tag,
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
          setServerError(expJson.error?.message || "Failed to load decision details.");
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
        setServerError("Failed to load decision details.");
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
        setServerError(json.error?.message || "Failed to update decision.");
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
        setServerError(json.error?.message || "Failed to archive decision.");
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
        <p className="text-xs text-slate-400">Loading decision details...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Link
        href={`/experiences/${id}`}
        className="inline-flex items-center text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Cancel & Back to Journey
      </Link>

      <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4DA3FF]/10 text-[#4DA3FF] border border-[#4DA3FF]/20">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#F1F5F9] tracking-tight">
                Edit Initial Decision
              </h1>
              <p className="text-xs text-[#94A3B8]">
                Update your baseline hypothesis, context, domain, or publication status.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-8 text-xs border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Archive
          </Button>
        </div>

        {showDeleteConfirm && (
          <div className="m-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs space-y-2.5">
            <div className="flex items-start space-x-2 text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <p className="leading-relaxed">
                Are you sure you want to archive this journey? It will be removed from the public timeline feed and preserved as read-only in your profile archive.
              </p>
            </div>

            <div className="flex items-center space-x-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="h-7 text-xs px-2.5 border-white/10 bg-white/[0.03] text-[#F1F5F9] hover:bg-white/[0.06]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isDeleting}
                onClick={onArchive}
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

        <form onSubmit={handleSubmit(onUpdate)}>
          <div className="p-5 sm:p-6 space-y-4">
            {serverError && (
              <div className="flex items-start space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-xs font-semibold text-[#F1F5F9]">
                  Decision Title <span className="text-[#4DA3FF]">*</span>
                </Label>
                <span className="text-[10px] text-[#64748B] font-mono">
                  {titleValue.length}/150
                </span>
              </div>
              <Input
                id="title"
                placeholder="What choice or hypothesis are you pursuing?"
                className="h-9 text-xs sm:text-sm bg-black/60 border-white/[0.08] text-[#F1F5F9] focus-visible:ring-[#4DA3FF]"
                maxLength={150}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-[11px] text-rose-400">{errors.title.message}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="category_id" className="text-xs font-semibold text-[#F1F5F9]">
                Domain / Category <span className="text-[#4DA3FF]">*</span>
              </Label>
              <select
                id="category_id"
                className="w-full h-9 rounded-lg border border-white/[0.08] bg-black/60 px-3 py-1 text-xs text-[#F1F5F9] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4DA3FF]"
                {...register("category_id")}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0A0D14] text-[#F1F5F9]">
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-[11px] text-rose-400">{errors.category_id.message}</p>
              )}
            </div>

            {/* Story Narrative */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="story" className="text-xs font-semibold text-[#F1F5F9]">
                  Decision Narrative & Baseline Starting Conditions <span className="text-[#4DA3FF]">*</span>
                </Label>
                <span className="text-[10px] text-[#64748B] font-mono">
                  {storyValue.length}/10,000
                </span>
              </div>
              <textarea
                id="story"
                rows={8}
                placeholder="Document your thinking, reason for choosing this path, expected milestones, and initial baseline..."
                className="w-full rounded-lg border border-white/[0.08] bg-black/60 p-3 text-xs sm:text-sm text-[#F1F5F9] shadow-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#4DA3FF] focus:ring-1 focus:ring-[#4DA3FF] resize-y leading-relaxed"
                maxLength={10000}
                {...register("story")}
              />
              {errors.story && (
                <p className="text-[11px] text-rose-400">{errors.story.message}</p>
              )}
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tags" className="text-xs font-semibold text-[#F1F5F9] flex items-center space-x-1">
                  <Tag className="h-3.5 w-3.5 text-[#64748B] mr-1" />
                  Tags <span className="text-[10px] text-[#64748B] font-normal">(Optional, max 5)</span>
                </Label>
                <span className="text-[10px] text-[#64748B] font-mono">
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
                className="h-9 text-xs bg-black/60 border-white/[0.08] text-[#F1F5F9] focus-visible:ring-[#4DA3FF]"
              />

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-xs pl-2.5 pr-1.5 py-0.5 flex items-center space-x-1 bg-white/[0.04] text-[#CBD5E1] border border-white/[0.08]"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="rounded-full p-0.5 hover:bg-white/10 text-[#64748B] hover:text-[#F1F5F9]"
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
              <Label className="text-xs font-semibold text-[#F1F5F9]">Publication Visibility</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("status", "active")}
                  className={`rounded-xl border p-3 text-left text-xs transition-all ${
                    statusValue === "active"
                      ? "border-[#4DA3FF]/50 bg-[#4DA3FF]/10 text-[#F1F5F9]"
                      : "border-white/[0.08] bg-black/40 text-[#94A3B8] hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="font-semibold text-[#F1F5F9]">Published</p>
                  <p className="text-[11px] text-[#94A3B8]">Visible on longitudinal feed and public discovery.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("status", "hidden")}
                  className={`rounded-xl border p-3 text-left text-xs transition-all ${
                    statusValue === "hidden"
                      ? "border-[#4DA3FF]/50 bg-[#4DA3FF]/10 text-[#F1F5F9]"
                      : "border-white/[0.08] bg-black/40 text-[#94A3B8] hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="font-semibold text-[#F1F5F9]">Draft (Private)</p>
                  <p className="text-[11px] text-[#94A3B8]">Saved privately in your personal profile journal.</p>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 p-5 border-t border-white/[0.06] bg-black/30">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs font-semibold bg-[#4DA3FF] text-black hover:bg-[#60A5FA] px-4 rounded-lg shadow-sm"
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
          </div>
        </form>
      </div>
    </div>
  );
}
