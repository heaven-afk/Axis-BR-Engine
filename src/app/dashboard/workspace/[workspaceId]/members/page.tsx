import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/actions/workspace";
import { MembersClient } from "@/components/members-client";

export const dynamic = "force-dynamic";

export default async function MembersPage({
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

  const members = workspace.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.name,
    email: m.email,
    avatarUrl: m.avatarUrl,
    role: m.role,
    status: m.status,
    inviteToken: m.inviteToken,
    joinedAt: m.joinedAt,
    invitedBy: m.invitedBy,
  }));

  return (
    <MembersClient
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      ownerUserId={workspace.ownerUserId}
      currentUserId={userId}
      currentUserRole={role}
      members={members}
    />
  );
}
