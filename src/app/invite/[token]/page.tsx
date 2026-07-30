import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getInviteDetails, acceptWorkspaceInvite } from "@/lib/actions/workspace";
import { Shield, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  const details = await getInviteDetails(token);

  if (!details.valid) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-void font-sans">
        <div className="telemetry-panel p-8 max-w-md w-full text-center space-y-4">
          <div className="grid size-12 place-items-center rounded-full bg-signal-red/10 text-signal-red border border-signal-red/30 mx-auto">
            <AlertCircle size={24} />
          </div>
          <h1 className="font-display font-bold text-xl uppercase">Invalid or Expired Invitation</h1>
          <p className="font-mono text-xs text-text-muted">
            {details.message || "This invitation link is invalid or has expired."}
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-sm bg-panel-raised border border-line px-5 py-2.5 font-mono text-xs text-text-primary hover:border-signal-orange transition"
            >
              Go To Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  async function handleAccept() {
    "use server";
    const res = await acceptWorkspaceInvite(token);
    redirect(`/dashboard/workspace/${res.workspaceId}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-void relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-signal-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="telemetry-panel p-8 max-w-md w-full relative z-10 space-y-6 shadow-panel-glow">
        <div className="text-center space-y-2">
          <div className="grid size-12 place-items-center rounded-md bg-signal-orange/15 text-signal-orange border border-signal-orange/30 mx-auto mb-3">
            <Shield size={24} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal-orange font-bold">
            AXIS ENGINE // INVITATION
          </p>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-tight">
            You&apos;re Invited!
          </h1>
          <p className="font-mono text-xs text-text-muted leading-relaxed">
            You have been invited to join <strong className="text-text-primary">{details.workspaceName}</strong> as an{" "}
            <span className="text-signal-cyan font-bold uppercase">{details.role}</span>.
          </p>
        </div>

        {details.email && (
          <div className="telemetry-panel-raised p-3 text-center font-mono text-xs">
            <span className="text-text-muted">Invited Email: </span>
            <span className="text-text-primary font-bold">{details.email}</span>
          </div>
        )}

        {userId ? (
          <form action={handleAccept} className="space-y-3">
            <button
              type="submit"
              className="w-full h-11 rounded-sm bg-signal-orange text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-signal-orange/90 transition shadow-panel-glow"
            >
              <CheckCircle2 size={16} /> Accept Invitation & Join
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-xs text-text-muted text-center">
              Please sign in or create an account to accept this invitation.
            </p>
            <Link
              href={`/sign-in?redirect_url=/invite/${token}`}
              className="w-full h-11 rounded-sm bg-signal-orange text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-signal-orange/90 transition shadow-panel-glow flex items-center justify-center"
            >
              Sign In To Accept <ArrowRight size={15} />
            </Link>
          </div>
        )}

        <div className="pt-4 border-t border-line text-center font-mono text-[10px] text-text-muted">
          POWERED BY AXIS STAT ENGINE · NOVA TECHNOLOGIES
        </div>
      </div>
    </main>
  );
}
