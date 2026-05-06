"use client";
import { Dialog } from "@/components/ui/dialog";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserList } from "./list";

type UserListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserListDialog({ open, onOpenChange }: UserListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>User List</DialogTitle>
          <DialogDescription>Select a user</DialogDescription>
        </DialogHeader>
        <UserList />
      </DialogContent>
    </Dialog>
  );
}
