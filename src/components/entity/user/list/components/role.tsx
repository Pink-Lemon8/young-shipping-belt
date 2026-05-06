import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { userRoles } from "@/lib/auth/roles-and-permissions";

const roles = Object.keys(userRoles);

export function Role({
  role,
  className,
}: {
  role: (typeof roles)[number];
  className?: string;
}) {
  const roleColors = {
    superAdmin: "bg-pink-500 hover:bg-pink-600",
    admin: "bg-violet-500 hover:bg-violet-600",
    labelHelper: "bg-yellow-500 hover:bg-yellow-600",
    pharmacy: "bg-green-500 hover:bg-green-600",
    coordinator: "bg-blue-500 hover:bg-blue-600",
    regular: "bg-emerald-500 hover:bg-emerald-600",
    guest: "bg-slate-500 hover:bg-slate-600",
  };

  return (
    <Badge
      className={cn(
        "capitalize cursor-pointer",
        roleColors[role as keyof typeof roleColors],
        className
      )}
    >
      {role}
    </Badge>
  );
}
