"use clinet";

import { authClient } from "@/lib/auth/auth-client";
import { Result } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Passkey } from "@better-auth/passkey";

type PasskeyFormProps = {
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function PasskeyForm({ setResult }: PasskeyFormProps) {
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [passkey, setPasskey] = useState<Passkey | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const fetchPasskey = async () => {
    setLoading(true);
    const passkey = await authClient.passkey.listUserPasskeys();
    if (passkey.data) {
      setPasskeys(passkey.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (passkeys === null && !loading) fetchPasskey();
  }, []);

  const handleAddPasskey = async () => {
    authClient.passkey
      .addPasskey({
        name: "Passkey_" + ((passkeys?.length ?? 0) + 1),
      })
      .then(async (res) => {
        if (res?.error) {
          const errorMessage = res?.error?.message;
          toast.error(
            <>
              <p>Failed to enable passkey.</p>
              <p>
                Error: <span className="capitalize">{errorMessage}</span>
              </p>
            </>
          );
          setResult?.({
            status: "error",
            messages: [errorMessage ?? "Failed to enable passkey"],
          });
          return;
        }
        await fetchPasskey();
        toast.success("Passkey is enabled successfully");
        setResult?.({
          status: "success",
          messages: ["Passkey is enabled successfully"],
        });
      });
  };

  const handleDeletePasskey = async (id: string) => {
    if (passkeys && passkeys.length > 0) {
      authClient.passkey
        .deletePasskey({
          id,
        })
        .then((res) => {
          if (res?.error) {
            const errorMessage = res?.error?.message;
            toast.error(
              <>
                <p>Failed to disable passkey.</p>
                <p>
                  Error: <span className="capitalize">{errorMessage}</span>
                </p>
              </>
            );
            setResult?.({
              status: "error",
              messages: [errorMessage ?? "Failed to disable passkey"],
            });
            return;
          }
          toast.success("Passkey is disabled successfully");
          setResult?.({
            status: "success",
            messages: ["Passkey is disabled successfully"],
          });
          setPasskeys(passkeys.filter((passkey) => passkey.id !== id));
          return res;
        });
    }
  };

  const showDeleteDialog = (passkey: Passkey) => {
    setPasskey(passkey);
    setOpenDeleteDialog(true);
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          className="cursor-pointer group"
          variant="outline"
          onClick={handleAddPasskey}
        >
          <Plus className="w-4 h-4 group-hover:rotate-360 transition-all duration-300" />
          Add
        </Button>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 overflow-y-auto max-h-[150px] px-1 py-2">
        {loading ? (
          Array.from({ length: 2 }).map((_, index) => <Loading key={index} />)
        ) : passkeys && passkeys?.length > 0 ? (
          passkeys?.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              passkey={passkey}
              showDeleteDialog={showDeleteDialog}
            />
          ))
        ) : (
          <NoPasskeyItem addPasskey={handleAddPasskey} />
        )}
      </div>

      <AlertDialog
        open={openDeleteDialog}
        onOpenChange={(open) => {
          if (loading) return;
          if (!open) {
            setOpenDeleteDialog(open);
          }
          setOpenDeleteDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will remove the passkey from
              your account.
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                Passkey Name:{" "}
                <span className="capitalize font-bold text-destructive">
                  {passkey?.name?.replaceAll("_", " ")}
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenDeleteDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!passkey) return;
                setLoading(true);
                await handleDeletePasskey(passkey.id);
                setLoading(false);
                setOpenDeleteDialog(false);
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-1 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Loading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full h-12 flex items-center justify-between border rounded-md",
        className
      )}
    >
      <Skeleton className={cn("w-full h-12 flex", className)} />
      <Loader2 className="absolute left-1/2 -translate-x-1/2 w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function PasskeyItem({
  className,
  passkey,
  showDeleteDialog,
}: {
  className?: string;
  passkey: Passkey;
  showDeleteDialog: (passkey: Passkey) => void;
}) {
  return (
    <div
      className={cn(
        "w-full h-12 flex items-center justify-between border rounded-md p-2",
        className
      )}
    >
      <div className="capitalize"> {passkey?.name?.replaceAll("_", " ")}</div>
      <Button
        variant="ghost"
        className="cursor-pointer text-destructive group"
        onClick={() => showDeleteDialog(passkey)}
      >
        <Trash2 className="w-4 h-4 group-hover:rotate-45 transition-all duration-300" />
      </Button>
    </div>
  );
}
function NoPasskeyItem({
  className,
  addPasskey,
}: {
  className?: string;
  addPasskey: () => void;
}) {
  return (
    <div
      className={cn(
        "w-full h-12 flex items-center justify-center border rounded-md p-2",
        className
      )}
    >
      <div className="text-muted-foreground">No passkeys added yet.</div>
    </div>
  );
}
