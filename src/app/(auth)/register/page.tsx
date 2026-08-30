"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
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
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
          emailRedirectTo: `${origin}/api/v1/auth/callback`,
        },
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      if (authData.session) {
        // Automatically logged in (if email confirmation disabled in dev)
        router.push("/");
        router.refresh();
      } else {
        // Confirmation email sent
        setSuccessMessage(
          "Registration successful! Please check your email inbox to verify your account."
        );
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Create Anonymous Account</CardTitle>
        <CardDescription className="text-xs">
          Choose an anonymous handle to explore and share real outcomes
        </CardDescription>
      </CardHeader>

      {successMessage ? (
        <CardContent className="space-y-4 pt-2">
          <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
            <p className="text-xs text-foreground font-medium">{successMessage}</p>
          </div>
          <Link href="/login" className="block w-full">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="flex items-center space-x-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">Anonymous Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. PhoenixRiser"
                autoComplete="username"
                {...register("username")}
              />
              <p className="text-[11px] text-muted-foreground">
                Only letters, numbers, and underscores (3-30 chars).
              </p>
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
              />
              <p className="text-[11px] text-muted-foreground">
                Your email is strictly confidential and never displayed.
              </p>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
