import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <Link href="/" className="mb-6 flex items-center space-x-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-mono text-base font-bold text-white shadow-md shadow-primary/25">
          E
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          Eside
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
