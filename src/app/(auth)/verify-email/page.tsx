import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <Link
        href="/"
        className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Home
      </Link>

      <Card className="border-border bg-surface-card shadow-lg shadow-black/20 text-center">
        <CardHeader className="space-y-2 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            We sent a verification link to your email address. Click the link to complete your registration.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2 text-xs text-muted-foreground space-y-2">
          <p>
            Didn&apos;t receive the email? Check your spam folder or wait a few minutes before requesting another link.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 pt-2">
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full h-9 text-xs">
              Return to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
