import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Sparkles, Compass, CheckCircle2, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-10 py-6 sm:py-12 text-center">
      {/* Hero Section */}
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center space-x-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Eside Platform — MVP Foundation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Learn from real human <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">experiences</span> &amp; long-term outcomes.
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Instead of endless opinions, Eside collects lived experiences, structured actions, and verified 30-day, 90-day, and 180-day outcomes.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto font-medium">
              Join Anonymously
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Safe Anonymity</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Share vulnerable situations and honest reflections without fear of judgment or identity exposure.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
              <Compass className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Outcome Timelines</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Discover what happened 30, 90, and 180 days after decisions were made across education, career, and life.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Collective Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              Turn individual stories into structured knowledge to help people make well-informed life choices.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Milestone 1 System Status */}
      <Card className="w-full border-border/80 bg-card/40 text-left">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Milestone 1 Architecture Status</span>
            </CardTitle>
            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              v0.1.0-M1
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground font-mono">
          <div className="flex justify-between py-1 border-b border-border/40">
            <span>Framework:</span>
            <span className="text-foreground">Next.js App Router (TypeScript Strict)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span>Design System:</span>
            <span className="text-foreground">Tailwind CSS + shadcn/ui (#4F46E5 / #0F172A)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span>Auth &amp; Data Layer:</span>
            <span className="text-foreground">Supabase SSR + Edge Cookie Middleware</span>
          </div>
          <div className="flex justify-between py-1">
            <span>API Standard:</span>
            <span className="text-foreground">REST /api/v1 (Envelope: success, data, error)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
