"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
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
    let memberships = await prisma.workspaceMember.findMany({
      where: { userId, status: "active" },
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

    // Auto-initialize personal workspace on first visit if user has no workspaces
    if (memberships.length === 0) {
      await ensurePersonalWorkspace();
      memberships = await prisma.workspaceMember.findMany({
        where: { userId, status: "active" },
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
    }

    return memberships.map((m) => ({
      workspace: m.workspace,
      role: m.role,
    }));
  } catch (error) {
    console.error("Database error in getUserWorkspaces:", error);
    return [];
  }
}

// ── GET single workspace with enriched member details ──────────────────────
export async function getWorkspace(workspaceId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId, status: "active" },
  });
  if (!member) throw new Error("Forbidden");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
      },
      tournaments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!workspace) throw new Error("Workspace not found");

  // Batch fetch Clerk user details for all members with valid userId
  const userIds = workspace.members
    .map((m) => m.userId)
    .filter((id): id is string => Boolean(id));

  let clerkUserMap: Record<string, { name: string; email: string; avatarUrl: string }> = {};

  if (userIds.length > 0) {
    try {
      const client = await clerkClient();
      const clerkUsers = await client.users.getUserList({ userId: userIds });
      const userList = clerkUsers.data || clerkUsers;

      clerkUserMap = userList.reduce((acc, u) => {
        const primaryEmail = u.emailAddresses?.find(
          (e) => e.id === u.primaryEmailAddressId
        )?.emailAddress || u.emailAddresses?.[0]?.emailAddress || "";

        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || primaryEmail || u.id;

        acc[u.id] = {
          name: fullName,
          email: primaryEmail,
          avatarUrl: u.imageUrl || "",
        };
        return acc;
      }, {} as Record<string, { name: string; email: string; avatarUrl: string }>);
    } catch (err) {
      console.warn("Could not fetch Clerk user profiles:", err);
    }
  }

  const enrichedMembers = workspace.members.map((m) => {
    const profile = m.userId ? clerkUserMap[m.userId] : null;
    return {
      ...m,
      name: profile?.name || m.email || m.userId || "Member",
      email: profile?.email || m.email || "",
      avatarUrl: profile?.avatarUrl || "",
    };
  });

  return {
    workspace: {
      ...workspace,
      members: enrichedMembers,
    },
    role: member.role,
  };
}

// ── CREATE personal workspace ──────────────────────────────────────────────
export async function ensurePersonalWorkspace() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const existing = await prisma.workspaceMember.findFirst({
      where: { userId, status: "active" },
      include: { workspace: true },
    });
    if (existing) return existing.workspace;

    const ws = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        type: "personal",
        ownerUserId: userId,
        members: {
          create: { userId, role: "owner", status: "active" },
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
        create: { userId, role: "owner", status: "active" },
      },
    },
  });

  revalidatePath("/dashboard");
  return ws;
}

// ── INVITE member by Email or User ID ──────────────────────────────────────
export async function inviteMember(
  workspaceId: string,
  identifier: string,
  role: "analyst" | "observer"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Check inviter permission
  const inviterMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId, status: "active" },
  });
  if (!inviterMember || inviterMember.role === "observer") {
    throw new Error("Forbidden: Only owners and analysts can invite members.");
  }

  const cleanIdentifier = identifier.trim();
  const isEmail = cleanIdentifier.includes("@");

  if (isEmail) {
    const email = cleanIdentifier.toLowerCase();

    // 1. Check if user already exists in Clerk
    let targetUserId: string | null = null;
    try {
      const client = await clerkClient();
      const clerkUsers = await client.users.getUserList({ emailAddress: [email] });
      const userList = clerkUsers.data || clerkUsers;
      if (userList.length > 0) {
        targetUserId = userList[0].id;
      }
    } catch (err) {
      console.warn("Clerk lookup failed for email:", email, err);
    }

    // If user already exists in Clerk, check if active member
    if (targetUserId) {
      const existingMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: targetUserId },
      });

      if (existingMember && existingMember.status === "active") {
        throw new Error(`User with email "${email}" is already a member of this workspace.`);
      }

      const member = existingMember
        ? await prisma.workspaceMember.update({
            where: { id: existingMember.id },
            data: {
              userId: targetUserId,
              email,
              role,
              status: "active",
            },
          })
        : await prisma.workspaceMember.create({
            data: {
              workspaceId,
              userId: targetUserId,
              email,
              role,
              invitedBy: userId,
              status: "active",
            },
          });

      revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
      return { member, isPending: false, inviteToken: null };
    }

    // If user does not exist in Clerk yet, create a PENDING email invitation
    const existingInvite = await prisma.workspaceMember.findFirst({
      where: { workspaceId, email },
    });

    const inviteToken = existingInvite?.inviteToken || `inv_${crypto.randomUUID().replace(/-/g, "")}`;
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const member = existingInvite
      ? await prisma.workspaceMember.update({
          where: { id: existingInvite.id },
          data: { role, status: "pending", inviteToken, inviteExpiry, invitedBy: userId },
        })
      : await prisma.workspaceMember.create({
          data: {
            workspaceId,
            email,
            role,
            invitedBy: userId,
            inviteToken,
            inviteExpiry,
            status: "pending",
          },
        });

    revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
    return { member, isPending: true, inviteToken };
  } else {
    // Standard User ID (`user_...`) invite
    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: cleanIdentifier },
    });

    const member = existingMember
      ? await prisma.workspaceMember.update({
          where: { id: existingMember.id },
          data: { role, status: "active" },
        })
      : await prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId: cleanIdentifier,
            role,
            invitedBy: userId,
            status: "active",
          },
        });

    revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
    return { member, isPending: false, inviteToken: null };
  }
}

// ── GET Invite Link Details ────────────────────────────────────────────────
export async function getInviteDetails(inviteToken: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { inviteToken },
    include: {
      workspace: true,
    },
  });

  if (!member || member.status !== "pending") {
    return { valid: false, message: "Invalid or expired invitation link." };
  }

  if (member.inviteExpiry && member.inviteExpiry < new Date()) {
    return { valid: false, message: "This invitation link has expired." };
  }

  return {
    valid: true,
    workspaceName: member.workspace.name,
    role: member.role,
    email: member.email,
    workspaceId: member.workspaceId,
  };
}

// ── ACCEPT Workspace Invitation ────────────────────────────────────────────
export async function acceptWorkspaceInvite(inviteToken: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: Please sign in first.");

  const member = await prisma.workspaceMember.findUnique({
    where: { inviteToken },
    include: { workspace: true },
  });

  if (!member || member.status !== "pending") {
    throw new Error("Invalid or expired invitation.");
  }

  if (member.inviteExpiry && member.inviteExpiry < new Date()) {
    throw new Error("This invitation has expired.");
  }

  // Update membership to active for current user
  await prisma.workspaceMember.update({
    where: { id: member.id },
    data: {
      userId,
      status: "active",
      joinedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workspace/${member.workspaceId}`);

  return { workspaceId: member.workspaceId, workspaceName: member.workspace.name };
}

// ── REMOVE / REVOKE member or invite ───────────────────────────────────────
export async function removeMember(workspaceId: string, memberId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId, status: "active" },
  });
  if (!requester || requester.role !== "owner") throw new Error("Forbidden: Only workspace owners can remove members.");

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
}

// ── UPDATE member role ─────────────────────────────────────────────────────
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: "analyst" | "observer"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requester = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId, status: "active" },
  });
  if (!requester || requester.role !== "owner") throw new Error("Forbidden");

  const member = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}/members`);
  return member;
}
