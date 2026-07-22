import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/actions/workspace";
import { WorkspaceHomeClient } from "@/components/workspace-home-client";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { workspaceId } = await params;

  let data;
  try {
    data = await getWorkspace(workspaceId);
  } catch {
    redirect("/dashboard");
  }

  if (!data?.workspace) redirect("/dashboard");

  const { workspace, role } = data;

  // Serialize dates for client components
  const tournaments = (workspace.tournaments ?? []).map((t: { id: string; name: string; gameMode: string; format: string; numDays: number; lobbiesPerDay: number; createdAt: Date }) => ({
    id: t.id,
    name: t.name,
    gameMode: t.gameMode,
    format: t.format,
    numDays: t.numDays,
    lobbiesPerDay: t.lobbiesPerDay,
    createdAt: t.createdAt,
  }));

  return (
    <WorkspaceHomeClient
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceType={workspace.type}
      role={role}
      tournaments={tournaments}
    />
  );
}
