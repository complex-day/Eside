"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft, Save } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string>("anonymous");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  });

  const bioValue = watch("bio") || "";

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/v1/profile");
        const json = await res.json();
        if (json.success && json.data) {
          setCurrentUsername(json.data.username || "anonymous");
          reset({
            bio: json.data.bio || "",
          });
        }
      } catch {
        setServerError("Failed to load existing profile.");
      } finally {
        setIsFetching(false);
      }
    }
    loadProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileUpdateInput) => {
    setIsLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/v1/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error?.message || "Failed to update profile.");
        return;
      }

      setSuccessMessage("Profile updated successfully!");
      router.refresh();
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <Link
        href="/profile"
        className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Profile
      </Link>

      <Card className="border-border bg-surface-card shadow-md">
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className="text-lg font-bold">Edit Anonymous Profile</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Customize your anonymous bio and avatar. Your handle remains private to protect identity integrity.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="flex items-start space-x-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center space-x-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Avatar Preview */}
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <UserAvatar username={currentUsername} size="lg" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">@{currentUsername}</p>
                <p className="text-[11px] text-muted-foreground">
                  Anonymous Avatar (Deterministic Gradient Silhouette)
                </p>
              </div>
            </div>

            {/* Bio Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-xs font-medium">
                  Bio / Perspective
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {bioValue.length} / 300
                </span>
              </div>
              <textarea
                id="bio"
                rows={4}
                placeholder="Share a short background (e.g., Computer science graduate who overcame academic probation. Interested in resilience and career shifts.)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={300}
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-[11px] text-destructive">{errors.bio.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-2 border-t border-border/60">
            <Link href="/profile">
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
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
