"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
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
import { AlertCircle, CheckCircle, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("username", {
            type: "manual",
            message: "Username is already taken. Please choose another handle.",
          });
          setServerError("Username is already taken. Please choose another handle.");
        } else {
          setServerError(result.error?.message || "Registration failed.");
        }
        return;
      }

      if (result.data?.session) {
        // Auto-confirmed login session
        router.push("/profile");
        router.refresh();
      } else {
        // Confirmation email sent
        setSuccessMessage(
          "Account created! If email verification is enabled, please check your inbox to activate your account."
        );
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <Link
        href="/"
        className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Eside
      </Link>

      <Card className="border-border bg-surface-card shadow-lg shadow-black/20">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold tracking-tight">
              Create Account
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Choose an anonymous handle. Your email is private and never exposed.
          </CardDescription>
        </CardHeader>

        {successMessage ? (
          <CardContent className="space-y-4 pt-2">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle className="h-7 w-7 text-emerald-400" />
              <p className="text-xs text-foreground font-medium">{successMessage}</p>
            </div>
            <Link href="/login" className="block w-full">
              <Button variant="outline" className="w-full h-9 text-xs">
                Go to Sign In
              </Button>
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-3.5">
              {serverError && (
                <div className="flex items-start space-x-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium">
                  Anonymous Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. PhoenixRiser"
                  autoComplete="username"
                  className="h-9 text-xs"
                  {...register("username")}
                />
                <p className="text-[11px] text-muted-foreground">
                  3–30 characters (letters, numbers, underscore).
                </p>
                {errors.username && (
                  <p className="text-[11px] text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-9 text-xs"
                  {...register("email")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Used strictly for account recovery and login.
                </p>
                {errors.email && (
                  <p className="text-[11px] text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-9 text-xs"
                  {...register("password")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Minimum 8 characters.
                </p>
                {errors.password && (
                  <p className="text-[11px] text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full h-9 text-xs font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Anonymous Account"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
