"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Dispatch, SetStateAction } from "react";
import ProcessViewInfoData from "./data";

type ProcessViewInfoModelProps = {
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  queue?: any;
  groupedQueues?: any[];
};

export function ProcessViewInfoModel({
  open = false,
  setOpen = undefined,
  queue = undefined,
  groupedQueues = undefined,
}: ProcessViewInfoModelProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Complete information about this order
          </DialogDescription>
        </DialogHeader>
        <div className="grow overflow-y-auto pr-2 -mr-2">
          <ProcessViewInfoData queue={queue} groupedQueues={groupedQueues} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
