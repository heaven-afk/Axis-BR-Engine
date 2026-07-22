"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

// ── GET current user's workspaces ──────────────────────────────────────────
export async function getUserWorkspaces() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            members: true,
            tournaments: { orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return memberships.map((m) => ({
      workspace: m.workspace,
      role: m.role,
    }));
  } catch (error) {
    console.error("Database error in getUserWorkspaces:", error);
    return [];
  }
}

// ── GET single workspace (with role check) ─────────────────────────────────
export async function getWorkspace(workspaceId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new Error("Forbidden");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: true,
      tournaments: { orderBy: { createdAt: "desc" } },
    },
  });

  return { workspace, role: member.role };
}

// ── CREATE personal workspace on first sign-in ─────────────────────────────
export async function ensurePersonalWorkspace() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    // Check if the user already has a personal workspace
    const existing = await prisma.workspaceMember.findFirst({
      where: { userId },
      include: { workspace: true },
    });
    if (existing) return existing.workspace;

    // Create personal workspace
    const ws = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        type: "personal",
        ownerUserId: userId,
        members: {
          create: { userId, role: "owner" },
        },
      },
    });
    return ws;
  } catch (error) {
    console.error("Database error in ensurePersonalWorkspace:", error);
    return null;
  }
}

// ── CREATE team workspace ───────────────────────────────────────────────────
export async function createTeamWorkspace(name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const ws = await prisma.workspace.create({
    data: {
      name,
      type: "team",
      ownerUserId: userId,
      members: {
        create: { userId, role: "owner" },
      },
    },
  });

  revalidatePath("/dashboard");
  return ws;
}

// ── INVITE member to workspace ─────────────────────────────────────────────
export async function inviteMember(
  workspaceId: string,
  targetUserId: string,
  role: "analyst" | "observer"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Only owners and analysts can invite (owners can invite anyone, analysts can invite observers)
  const inviterMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!inviterMember || inviterMember.role === "observer")
    throw new Error("Forbidden");

  const member = await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    create: {
      workspaceId,
      userId: targetUserId,
      role,
      invitedBy: userId,
    },
    update: { role },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
  return member;
}

// ── REMOVE member ──────────────────────────────────────────────────────────
export async function removeMember(workspaceId: string, targetUserId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!requester || requester.role !== "owner") throw new Error("Forbidden");

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
}

// ── UPDATE member role ─────────────────────────────────────────────────────
export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  role: "analyst" | "observer"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!requester || requester.role !== "owner") throw new Error("Forbidden");

  const member = await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { role },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
  return member;
}
