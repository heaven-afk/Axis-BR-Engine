import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensurePersonalWorkspace, getUserWorkspaces } from "@/lib/actions/workspace";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Ensure the user has a personal workspace on first access
  await ensurePersonalWorkspace();

  const workspaceList = await getUserWorkspaces();

  return (
    <DashboardLayoutClient workspaces={workspaceList}>
      {children}
    </DashboardLayoutClient>
  );
}
