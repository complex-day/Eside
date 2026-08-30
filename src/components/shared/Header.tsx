import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user?: { email?: string; username?: string } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-white shadow-md shadow-primary/25">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-base font-bold tracking-tight text-foreground">
              Eside
            </span>
            <span className="hidden text-[10px] font-medium text-muted-foreground sm:inline-block">
              Learn from real outcomes
            </span>
          </div>
        </Link>

        {/* Header Right Action */}
        <div className="flex items-center space-x-2">
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">
                @{user.username || "anonymous"}
              </span>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  Profile
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
