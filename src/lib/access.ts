import type { WorkspaceRole } from "@/lib/types";

export const canManageWorkspace = (role: WorkspaceRole) => role === "owner";

export const canEditTournament = (role: WorkspaceRole) =>
  role === "owner" || role === "analyst";

export const assertCanEditTournament = (role: WorkspaceRole) => {
  if (!canEditTournament(role)) {
    throw new Error("Observers cannot edit tournament data.");
  }
};
