"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";



const logActionColors = {
  // Authentication related
  LOGIN_ATTEMPTED: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  LOGIN_SUCCESS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  FORGOT_PASSWORD_REQUESTED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  FORGOT_PASSWORD_CREATED_NEW: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  UPDATE_USER_PASSWORD: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",

  // User management
  CREATE_USER: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  EDIT_USER: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  TOGGLE_USER_STATUS: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300",
  CHANGE_USER_BELT: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  UPDATE_USER_ROLE: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  DELETE_USER: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",

  // Lymlight
  LYMLIGHT_ORDER_IMPORT: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  UPDATE_LYMLIGHT_STATUS:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",

  // Barcode
  ADD_BARCODE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",

  // Queue progression
  PULL_QUEUE_STAGE1: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  PULL_QUEUE_STAGE2: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  PULL_QUEUE_STAGE3: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  PUSH_QUEUE_STAGE2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PUSH_QUEUE_STAGE3: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  PUSH_QUEUE_COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  MANUAL_PUSH_QUEUE_COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",

  PUSH_QUEUE_BACK_STAGE1: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  PUSH_QUEUE_UNLOCK: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",

  // Review related
  PUSH_QUEUE_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PULL_QUEUE_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  PUSH_QUEUE_REVIEW_APPROVED: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  PUSH_QUEUE_REVIEW_DENIED: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",

  // Skip related
  PUSH_QUEUE_SKIP: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  PUSH_QUEUE_SKIP_OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",

  // Notifications
  ADD_PHARMACIST_DENIED_SMS_NOTIFICATION: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  DELETE_PHARMACIST_DENIED_SMS_NOTIFICATION: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",

  // Queue management
  DELETE_QUEUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",

  // Other possible actions (additional user-supplied, speculative based on context)
  // Add additional log actions here as needed, matching the established color pattern.
};


const logActionLabels: Record<string, string> = {

  LOGIN_ATTEMPTED: "Login Attempt",
  LOGIN_SUCCESS: "Login Success",

  FORGOT_PASSWORD_REQUESTED: "Forgot Password Requested",
  FORGOT_PASSWORD_CREATED_NEW: "Forgot Password Created New",

  UPDATE_USER_PASSWORD: "Password Updated",
  CREATE_USER: "User Added",
  EDIT_USER: "User Edited",
  TOGGLE_USER_STATUS: "Status Changed",
  CHANGE_USER_BELT: "Belt Changed",
  UPDATE_USER_ROLE: "Role Changed",
  DELETE_USER: "User Deleted",
  LYMLIGHT_ORDER_IMPORT: "Order Imported",
  UPDATE_LYMLIGHT_STATUS: "Lymlight Updated",
  ADD_BARCODE: "Barcode Added",

  PULL_QUEUE_STAGE1: "Pulled Stage 1",
  PULL_QUEUE_STAGE2: "Pulled Stage 2",
  PULL_QUEUE_STAGE3: "Pulled Stage 3",

  PUSH_QUEUE_STAGE2: "Pushed to Stage 2",
  PUSH_QUEUE_STAGE3: "Pushed to Stage 3",
  PUSH_QUEUE_COMPLETED: "Completed",
  MANUAL_PUSH_QUEUE_COMPLETED: "Manually Completed",

  PUSH_QUEUE_BACK_STAGE1: "Back to Stage 1",
  PUSH_QUEUE_UNLOCK: "Unlocked",

  PULL_QUEUE_REVIEW: "Pulled for Review",
  PUSH_QUEUE_REVIEW_APPROVED: "Approved",
  PUSH_QUEUE_REVIEW_DENIED: "Denied",

  PUSH_QUEUE_SKIP: "Skipped",
  PUSH_QUEUE_SKIP_OPEN: "Skip Opened",

  ADD_PHARMACIST_DENIED_SMS_NOTIFICATION: "Denied SMS Sent",
  DELETE_PHARMACIST_DENIED_SMS_NOTIFICATION: "Denied SMS Removed",
  DELETE_QUEUE: "Deleted Queue",
};

export function LogActionBadge({
  action,
  className,
}: {
  action: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "cursor-pointer uppercase",
        logActionColors[action as keyof typeof logActionColors],
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      {logActionLabels[action as keyof typeof logActionLabels] || action.replaceAll("_", " ")}
    </Badge>
  );
}
