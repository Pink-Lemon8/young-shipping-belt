"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Copy,
  Edit,
  Plus,
  UserSearch,
} from "lucide-react";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth/auth-client";
import { userRoleLevels } from "@/lib/auth/roles-and-permissions";
import { isUserRoleLevelAllowed } from "@/lib/auth/utils/helpers";
import type { Result } from "@/lib/types";
import PageNumber from "@/components/common/pagination-page";
import { FileShowImage } from "../../file/show/image";
import { AddUserDialog } from "../add/dialog";
import { EditUserDialog } from "../edit/dialog";
import type { User } from "../type";
import { getUsers } from "./actions";
import { Belt } from "./components/belt";
import { Role } from "./components/role";

type UserListProps = {
  baseUrl?: string;
};

export function UserList({ baseUrl }: UserListProps) {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const [users, setUsers] = useState<User[] | undefined>(undefined);
  const [search, setSearch] = useState<string | undefined>("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [result, setResult] = useState<Result | undefined>(undefined);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const res = await getUsers(
      {
        search,
        roles: selectedRoles.length > 0 ? selectedRoles : undefined,
      },
      page,
      limit,
    );

    if (res.status === "success") {
      setUsers(res.value.users);
      setTotalPages(res.value.totalPages);
      setPage(res.value.currentPage);
    }

    setLoadingUsers(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
    setTotalPages(1);
  };

  useEffect(() => {
    if (result === undefined || result?.status === "success") {
      fetchUsers();
    }
  }, [result, page, limit, search, selectedRoles]);

  const handleImpersonate = async (userId: string, userRole: string) => {
    if (!isUserRoleLevelAllowed(sessionData?.user?.role, userRole)) {
      toast.error("You are not authorized to impersonate this user", {
        description: "Please contact your administrator",
      });
      return;
    }

    if (sessionData?.session.impersonatedBy) {
      toast.error("You are already impersonating a user", {
        description:
          "Please stop impersonating before impersonating another user",
      });
      return;
    }

    const res = await authClient.admin.impersonateUser({
      userId,
    });

    if (!res.error) {
      toast.success("Impersonation started", {
        description: "You are now impersonating this user",
      });
      window.location.href = "/dashboard";
    } else {
      toast.error("Error impersonating user", {
        description: res?.error?.message ?? "You are not impersonating anyone",
      });
    }
  };

  const handleViewUser = (userId: string) => {
    if (!baseUrl) return;
    router.push(`${baseUrl}/${userId}`);
  };

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.info(
      <div className="flex items-start justify-start gap-2">
        <ClipboardCheck className="size-5" />
        <p>
          {label}:{" "}
          <span className="font-bold text-primary underline">{value}</span>{" "}
          copied to clipboard
        </p>
      </div>,
    );
  };

  const getUserInitials = (name?: string | null) =>
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  const renderUserAvatar = (user: User) => {
    const initials = getUserInitials(user.name);

    if (user.image) {
      return (
        <FileShowImage
          file={{ id: Number(user.image) }}
          width={256}
          height={256}
          className={cn("size-10 rounded-full p-0 m-0")}
        />
      );
    }

    return (
      <Avatar className={cn("rounded-full size-10")}>
        <AvatarImage
          src={`https://api.dicebear.com/6.x/initials/svg?seed=${initials}`}
        />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto">
          <div className="w-full xl:w-auto">
            <Input
              type="search"
              placeholder="Search users by ID, Name, or Email..."
              value={search}
              onChange={handleSearch}
              className="w-full sm:w-[300px]"
            />
          </div>
          <Combobox
            value={selectedRoles}
            onValueChange={(value) => {
              const values = Array.isArray(value) ? value : [value];
              setSelectedRoles(values);
              setPage(1);
              setTotalPages(1);
            }}
            options={Object.keys(userRoleLevels)
              .filter((role: string) => role !== "pharmacy" && role !== "labelHelper")
              .map((role) => ({
                label: role.charAt(0).toUpperCase() + role.slice(1),
                value: role,
              }))}
            placeholder="All Roles"
            searchPlaceholder="Search roles..."
            emptyText="No roles found."
            className="min-w-0 w-full sm:w-auto sm:min-w-[300px]"
            multiple
          />
        </div>

        <Button
          onClick={() => setShowAddUserDialog(true)}
          className="group w-auto self-start"
        >
          <Plus className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          Add User
        </Button>
      </div>

      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        setResult={setResult}
      />

      <EditUserDialog
        user={selectedUser}
        open={showEditUserDialog}
        onOpenChange={setShowEditUserDialog}
        setResult={setResult}
      />

      {loadingUsers ? (
        <LoadingUsers
          limit={limit}
          totalPages={totalPages}
          currentPage={page}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {renderUserAvatar(user)}

                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0">
                        {baseUrl ? (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-left text-base font-semibold"
                            onClick={() => handleViewUser(user.id)}
                          >
                            <span className="truncate">{user.name}</span>
                          </Button>
                        ) : (
                          <p className="truncate text-base font-semibold">
                            {user.name}
                          </p>
                        )}

                        <div className="mt-1">
                          <Role role={user.role} />
                        </div>
                      </div>

                      {isUserRoleLevelAllowed(
                        sessionData?.user?.role,
                        user.role,
                      ) && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0 cursor-pointer"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditUserDialog(true);
                          }}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        User ID
                      </p>
                      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <span className="min-w-0 truncate font-medium">
                          {user.id.substring(0, 4)}...
                          {user.id.substring(user.id.length - 4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 cursor-pointer"
                          onClick={() =>
                            copyToClipboard(user.id.toString(), "User ID")
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </p>
                      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <span className="min-w-0 break-all">{user.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 cursor-pointer"
                          onClick={() =>
                            copyToClipboard(
                              user.email.toString(),
                              "User Email",
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Department
                        </p>
                        <p className="truncate text-sm font-medium">
                          {user.department ?? "-"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Belt Access
                        </p>
                        <div className="shrink-0">
                          {user.beltCode ? (
                            <Belt
                              beltCode={user.beltCode}
                              className="whitespace-nowrap"
                            />
                          ) : ["pharmacist"].includes(
                              user.role ?? "regular"
                            ) ? (
                            <Belt beltCode="YES" className="whitespace-nowrap" />
                          ) : (
                            <Belt beltCode="NO" className="whitespace-nowrap" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isUserRoleLevelAllowed(
                    sessionData?.user?.role,
                    user.role,
                  ) && (
                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {sessionData?.session.impersonatedBy === null && (
                          <Button
                            variant="outline"
                            onClick={() => handleImpersonate(user.id, user.role)}
                            className="w-full min-w-0 cursor-pointer"
                          >
                            <UserSearch className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">Impersonate</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditUserDialog(true);
                          }}
                          className="w-full min-w-0 cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">Edit User</span>
                        </Button>
                      </div>
                    )}
                </div>
              ))
            ) : (
              <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            )}
          </div>

          <div className="relative hidden w-full max-h-[calc(100vh-300px)] overflow-auto rounded-md border xl:block">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-background shadow-xs">
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead className="max-w-[45px] text-base">ID</TableHead>
                  <TableHead className="text-base">Name</TableHead>
                  <TableHead className="text-base">Email</TableHead>
                  <TableHead className="text-base">Role</TableHead>
                  <TableHead className="text-base">Department</TableHead>
                  <TableHead className="text-base">Belt Access</TableHead>
                  <TableHead className="text-right text-base">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-center">
                        {renderUserAvatar(user)}
                      </TableCell>
                      <TableCell className="flex items-baseline justify-start gap-1 text-base">
                        {user.id.substring(0, 4)}...
                        {user.id.substring(user.id.length - 4)}
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="link"
                                size="icon"
                                className="cursor-pointer"
                                onClick={() =>
                                  copyToClipboard(user.id.toString(), "User ID")
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Copy User ID to clipboard
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="font-medium text-base">
                        {baseUrl ? (
                          <Button
                            variant="link"
                            className="cursor-pointer"
                            onClick={() => handleViewUser(user.id)}
                          >
                            {user.name}
                          </Button>
                        ) : (
                          user.name
                        )}
                      </TableCell>
                      <TableCell className="flex items-baseline justify-start gap-1 text-base">
                        {user.email}
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="link"
                                size="icon"
                                className="cursor-pointer"
                                onClick={() =>
                                  copyToClipboard(
                                    user.email.toString(),
                                    "User Email",
                                  )
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Copy User Email to clipboard
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-base">
                        <Role role={user.role} />
                      </TableCell>
                      <TableCell className="text-base">
                        {user.department ?? "-"}
                      </TableCell>
                      <TableCell className="text-base">
                        {user.beltCode ? (
                          <Belt beltCode={user.beltCode} />
                        ) : ["pharmacist"].includes(user.role ?? "regular") ? (
                          <Belt beltCode="YES" />
                        ) : (
                          <Belt beltCode="NO" />
                        )}
                      </TableCell>
                      <TableCell className="w-[1%] whitespace-nowrap text-right">
                        {isUserRoleLevelAllowed(
                          sessionData?.user?.role,
                          user.role,
                        ) && (
                            <div className="ml-auto flex items-center justify-end gap-2 whitespace-nowrap">
                              {sessionData?.session.impersonatedBy === null && (
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleImpersonate(user.id, user.role)
                                  }
                                  className="flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                >
                                  <UserSearch className="h-4 w-4 shrink-0" />
                                  Impersonate
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditUserDialog(true);
                                }}
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-base"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}

                {users &&
                  users.length > 0 &&
                  Array.from({ length: 10 - users.length }).map((_, index) => (
                    <TableRow
                      key={index}
                      className="border-none hover:bg-transparent"
                    >
                      <TableCell colSpan={8} className="text-center text-base">
                        <div className="h-10 rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <PageNumber
            totalPages={totalPages}
            currentPage={page}
            setCurrentPage={setPage}
          />
        </>
      )}
    </>
  );
}

function LoadingUsers({
  limit = 10,
  totalPages = 1,
  currentPage = 1,
}: {
  limit?: number;
  totalPages?: number;
  currentPage?: number;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
        {Array.from({ length: Math.min(limit, 5) }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative hidden max-h-[calc(100vh-300px)] overflow-hidden rounded-md border xl:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base">
                <Skeleton className="h-6 w-full" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: limit }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="text-center text-base">
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PageNumber totalPages={totalPages} currentPage={currentPage} />
    </>
  );
}
