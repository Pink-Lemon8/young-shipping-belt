import { userRoleLevels } from "../roles-and-permissions";

export function createSession(user: any): any {
  // This is a simplified session without JWT for demonstration
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export function isUserRoleLevelAllowed(
  currentUserRole: string | undefined | null,
  targetUserRole: string | undefined | null
) {
  if (!currentUserRole || !targetUserRole) return false;
  return (
    userRoleLevels[currentUserRole as keyof typeof userRoleLevels] <
    userRoleLevels[targetUserRole as keyof typeof userRoleLevels]
  );
}
