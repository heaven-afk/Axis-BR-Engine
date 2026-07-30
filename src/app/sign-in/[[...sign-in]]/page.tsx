import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-theme";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-void relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-signal-orange/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block group mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-signal-orange bg-signal-orange/10 border border-signal-orange/30 px-3 py-1 rounded-full group-hover:bg-signal-orange/20 transition-all">
              Axis Engine
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary font-display tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Sign in to your analyst workspace
          </p>
        </div>

        <SignIn appearance={clerkAppearance} />

        <p className="text-center text-[11px] text-text-muted font-mono tracking-wider mt-6 uppercase">
          Powered by Axis Stat Engine · Built on Nova Technologies
        </p>
      </div>
    </main>
  );
}
