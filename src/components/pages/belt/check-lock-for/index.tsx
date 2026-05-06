"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, LockIcon } from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { check } from "./action";
import { Result } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CheckLockFor({
  orderId,
  lockedForUserId,
  lockedAt,
  userBeltCode,
  loading,
  setLoading,
}: {
  orderId?: string;
  lockedForUserId?: string;
  lockedAt?: string;
  userBeltCode?: string;
  loading: boolean;
  setLoading?: (loading: boolean) => void;
}) {
  const [autoCheckCount, setAutoCheckCount] = useState(0);
  const maxAutoCheckLoading = 2;
  const router = useRouter();
  const [fetchLoading, setFetchLoading] = useState(false);

  const [isGood, setIsGood] = useState<boolean | undefined>(undefined);

  const { data: sessionData } = useSession();
  const [open, setOpen] = useState(false);

  const [result, setResult] = useState<Result | undefined>(undefined);

  const fetchCheck = async () => {
    if (!orderId || orderId?.trim() === "") {
      setResult({
        status: "error",
        messages: ["No order ID"],
      });
      return;
    }
    setFetchLoading(true);
    const res = await check(orderId);

    const userId = sessionData?.user?.id ?? "-1";
    const lockedForUserId = res?.value?.lockedForUserId ?? "-1";
    if (lockedForUserId !== "-1" && lockedForUserId !== "0")
      if (userId !== lockedForUserId) setIsGood(false);
      else setIsGood(true);
    setResult(res);
    setFetchLoading(false);
  };

  useEffect(() => {
    if (!sessionData?.user) return;
    fetchCheck();
    const timer = setTimeout(() => {
      if (autoCheckCount < maxAutoCheckLoading) {
        setAutoCheckCount((prev) => prev + 1);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [sessionData?.user, autoCheckCount, orderId]);

  useEffect(() => {
    if (isGood === false) setOpen(true);
    else if (isGood === true) setOpen(false);
  }, [isGood]);

  return (
    <>
      <Button
        disabled={loading || fetchLoading}
        className={cn(
          "group font-semibold capitalize",
          loading === false || fetchLoading === false
            ? isGood && isGood === true
              ? "text-white bg-green-600"
              : "text-white bg-destructive"
            : "bg-muted"
        )}
        onClick={() => {
          if (autoCheckCount < maxAutoCheckLoading) return;
          setFetchLoading(true);
          setAutoCheckCount((prev) => 0);
        }}
        variant="outline"
      >
        {fetchLoading || loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <LockIcon className="h-4 w-4 stroke-2" />
            {result?.status === "success" &&
              result?.value?.lockedForUserId &&
              result?.value?.lockedAt &&
              result?.value?.user?.name &&
              result?.value?.user?.email && (
                <span>{result?.value?.user?.name}</span>
              )}
          </>
        )}
      </Button>
      <CheckLockForModal
        open={open}
        setOpen={setOpen}
        userBeltCode={userBeltCode}
        loading={loading}
        setLoading={setLoading}
      />
    </>
  );
}

export function CheckLockForModal({
  open,
  setOpen,
  userBeltCode,
  loading,
  setLoading,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  userBeltCode?: string;
  loading: boolean;
  setLoading?: (loading: boolean) => void;
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!open) {
      setCountdown(15);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setLoading?.(true);
          router.push("/belt" + (userBeltCode ? "/" + userBeltCode : ""));
          setOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>!! Alert !!</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-bold text-red-500">
              This Order is not assigned to you.
            </span>
            <br />
            You will be redirected to your next order in{" "}
            <span className="font-bold text-red-500 text-lg">
              {countdown}
            </span>{" "}
            seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              setLoading?.(true);
              router.push("/belt" + (userBeltCode ? "/" + userBeltCode : ""));
              setOpen(false);
            }}
          >
            New Order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
