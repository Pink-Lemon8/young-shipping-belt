"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import {
  GetAllPhoneNumbersForSmsNotification,
  type PharmacistDeniedSmsNotificationValue,
  deletePhoneNumberFromNotification,
} from "./actions";
import { Trash2, UserRound, Phone } from "lucide-react";
import type { Result } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PharmacistDeniedSmsNotificationListProps = {
  className?: string;
  result?: Result | undefined;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function PharmacistDeniedSmsNotificationList({
  className = "",
  result = undefined,
  setResult = undefined,
}: PharmacistDeniedSmsNotificationListProps) {
  const [list, setList] = useState<PharmacistDeniedSmsNotificationValue[]>([]);
  const [selectedItem, setSelectedItem] = useState<
    PharmacistDeniedSmsNotificationValue | undefined
  >(undefined);

  const [removeAlertDialogOpen, setRemoveAlertDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPhoneNumbers = async () => {
    setLoading(true);
    const fetchResult = await GetAllPhoneNumbersForSmsNotification();
    if (fetchResult.status === "success")
      setList(fetchResult.value?.list ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (result?.status === "success") {
      setList(result?.value?.list ?? []);
    }
  }, [result, loading]);

  const handleRemovePhoneNumber = async (phoneNumber?: string) => {
    setLoading(true);
    const deleteResult = await deletePhoneNumberFromNotification(
      phoneNumber ?? selectedItem?.phoneNumber ?? "",
    );
    setResult?.(deleteResult);
    setSelectedItem(undefined);
    if (deleteResult.status === "success") {
      toast({
        title: "Success",
        description: "Phone number removed from the notification",
        variant: "default",
      });
    } else if (deleteResult.status === "error") {
      toast({
        title: "Error",
        description: "Failed to remove phone number from the notification",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <RemoveAlertDialog
        open={removeAlertDialogOpen}
        setOpen={setRemoveAlertDialogOpen}
        item={selectedItem}
        handleRemovePhoneNumber={handleRemovePhoneNumber}
      />
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle>SMS Notification Recipients</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {loading ? (
            <Loading />
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {list.length > 0 ? (
                list.map((item) => (
                  <div
                    key={item.phoneNumber}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card transition-colors hover:bg-accent/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <UserRound className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-1 h-3 w-3" />
                          {item.phoneNumber}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setSelectedItem(item);
                        setRemoveAlertDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <Phone className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No recipients found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    When you add phone numbers to the notification list, they
                    will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

type RemoveAlertDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  item?: PharmacistDeniedSmsNotificationValue;
  handleRemovePhoneNumber: (phoneNumber?: string) => void;
};

function RemoveAlertDialog({
  open,
  setOpen,
  item,
  handleRemovePhoneNumber,
}: RemoveAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove recipient</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you would like to remove{" "}
            <span className="font-bold text-destructive capitalize">
              {item?.name}
            </span>{" "}
            -{" "}
            <span className="font-bold text-destructive">
              {item?.phoneNumber ? `(${item?.phoneNumber})` : ""}
            </span>{" "}
            from the notification list?{" "}
            <span className="font-bold text-destructive capitalize">
              {item?.name}
            </span>{" "}
            will no longer receive SMS notifications when pharmacists deny any
            orders in Belt Queue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleRemovePhoneNumber()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Loading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      ))}
    </div>
  );
}
