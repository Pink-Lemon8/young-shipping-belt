/**
 * Process View "Item status" filter (belt queue metadata: orderedItems / specialItems / receivedItems).
 */

export type ProcessViewItemStatusFilter =
  | "ANY"
  | "FULL_PREP"
  | "FULL_ORDERED_ONLY"
  | "FULL_SPECIAL_ONLY"
  | "FULL_RECEIVED"
  | "MISSING_PREP"
  | "MISSING_RECEIVE";

export type ProcessViewItemStatus = ProcessViewItemStatusFilter;

export const PROCESS_VIEW_ITEM_STATUS_ANY: ProcessViewItemStatusFilter = "ANY";

export const PROCESS_VIEW_ITEM_STATUS_VALUES: ProcessViewItemStatusFilter[] = [
  "ANY",
  "FULL_PREP",
  "FULL_ORDERED_ONLY",
  "FULL_SPECIAL_ONLY",
  "FULL_RECEIVED",
  "MISSING_PREP",
  "MISSING_RECEIVE",
];

export const processViewItemStatusOptions: Array<{
  value: ProcessViewItemStatusFilter;
  label: string;
}> = [
    { value: "ANY", label: "Any (no line filter)" },
    {
      value: "FULL_PREP",
      label: "All lines: Ordered or Special",
    },
    {
      value: "FULL_ORDERED_ONLY",
      label: "All lines: Ordered",
    },
    { value: "FULL_SPECIAL_ONLY", label: "All lines: Special" },
    { value: "FULL_RECEIVED", label: "All lines: Received" },
    {
      value: "MISSING_PREP",
      label: "Some lines missing Ordered/Special",
    },
    {
      value: "MISSING_RECEIVE",
      label: "Ordered or Special, not all Received",
    },
  ];

export function parseProcessViewItemStatus(
  raw: string | null | undefined,
): ProcessViewItemStatusFilter {
  if (
    raw &&
    PROCESS_VIEW_ITEM_STATUS_VALUES.includes(raw as ProcessViewItemStatusFilter)
  ) {
    return raw as ProcessViewItemStatusFilter;
  }
  return "ANY";
}
