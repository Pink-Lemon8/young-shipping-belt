"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Result } from "@/lib/types";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import PharmacistDeniedSmsNotificationForm from "./form";
import PharmacistDeniedSmsNotificationList from "./list";

type PharmacistDeniedSmsNotificationModelProps = {
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export function PharmacistDeniedSmsNotificationModel({
  open = false,
  setOpen = undefined,
  setResult = undefined,
}: PharmacistDeniedSmsNotificationModelProps) {
  const [result, dispatch] = useState<Result | undefined>(undefined);

  useEffect(() => {
    setResult?.(result);
  }, [result, setResult]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">
            SMS Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure phone numbers to receive SMS notifications when
            pharmacists deny orders
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="mx-1">
            <h3 className="text-base font-semibold mb-2 text-foreground/90">
              Add SMS Recipient
            </h3>
            <PharmacistDeniedSmsNotificationForm setResult={dispatch} />
          </div>
        </div>

        <div className="p-6 pt-0">
          <PharmacistDeniedSmsNotificationList
            result={result}
            setResult={dispatch}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
