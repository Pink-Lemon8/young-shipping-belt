"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FileDown,
  ArrowLeft,
} from "lucide-react";
import { useBarcodeScanner } from "@/components/hooks/use-barcode-scanner";
import { useRouter } from "next/navigation";

export default function List({
  attributes,
  data = [],
}: {
  attributes: any[];
  data: any[];
}) {
  const router = useRouter();
  const { barcode, resetBarcode } = useBarcodeScanner();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [patientIdSearch, setPatientIdSearch] = useState("");
  const [trackingSearch, setTrackingSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 35;

  useEffect(() => {
    if (barcode) {
      setSearch(barcode);
      resetBarcode();
    }
  }, [barcode]);

  // Filter data based on all search fields
  const filteredData = data?.filter((item) => {
    const matchesGeneral = Object.values(item).some((value) =>
      value?.toString().toLowerCase().includes(search.toLowerCase())
    );

    const matchesOrderId =
      orderIdSearch === "" ||
      item.order_id
        ?.toString()
        .toLowerCase()
        .includes(orderIdSearch.toLowerCase());

    const matchesPatientId =
      patientIdSearch === "" ||
      item.patient_id
        ?.toString()
        .toLowerCase()
        .includes(patientIdSearch.toLowerCase());

    const matchesTracking =
      trackingSearch === "" ||
      item.tracking_number
        ?.toString()
        .toLowerCase()
        .includes(trackingSearch.toLowerCase());

    return (
      matchesGeneral && matchesOrderId && matchesPatientId && matchesTracking
    );
  });

  // Sort data by created_at
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Calculate pagination
  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData?.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Helper function to highlight search text
  const highlightText = (text: string) => {
    if (!search) return text;
    const parts = text?.toString().split(new RegExp(`(${search})`, "gi"));
    return parts?.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-bold px-2 py-1 rounded-md">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Excel export function
  const exportToExcel = () => {
    const csvContent = [
      attributes.join(","), // Header row
      ...sortedData.map((item) =>
        attributes
          .map(
            (attr) =>
              // Wrap in quotes to handle commas in data
              `"${item[attr]?.toString().replace(/"/g, '""') || ""}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    link.href = URL.createObjectURL(blob);
    link.download = `lot-data-${date}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="w-full">
      <div className="mb-12 space-y-4 px-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <Button
              onClick={() => router.push("/check-lot")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Input
              placeholder="Scan barcode or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <Button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="w-full sm:w-auto"
            >
              Sort By Date
              {sortOrder === "asc" ? (
                <ArrowUpIcon className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDownIcon className="ml-2 h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {paginatedData?.map((item, index) => (
            <div
              key={index}
              className={cn(
                "rounded-lg border bg-background p-4 shadow-sm",
                index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : undefined,
              )}
            >
              <div className="space-y-3">
                {attributes.map((attribute) => (
                  <div
                    key={attribute}
                    className="flex items-start justify-between gap-3 border-b border-border/50 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {attribute.replace("_", " ")}
                    </span>
                    <span className="min-w-0 flex-1 text-right text-sm">
                      {highlightText(item[attribute])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden w-full overflow-x-auto rounded-lg border md:block">
          <div className="min-w-max">
            <Table className="w-max min-w-full">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  {attributes.map((attribute) => (
                    <TableHead
                      key={attribute}
                      className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase sm:px-4"
                    >
                      {attribute.replace("_", " ").toUpperCase()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData?.map((item, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      "cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700",
                      index % 2 === 0 ? "bg-gray-100 dark:bg-gray-800" : undefined,
                    )}
                  >
                    {attributes.map((attribute) => (
                      <TableCell
                        key={attribute}
                        className="whitespace-nowrap px-3 py-3 text-sm sm:px-4 lg:px-5"
                      >
                        {highlightText(item[attribute])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Pagination className="justify-center sm:justify-start">
          <PaginationContent className="flex-wrap items-center justify-center gap-2 sm:justify-start">
            <PaginationItem>
              <PaginationPrevious
                className="cursor-pointer"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                isActive={currentPage === 1}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm sm:px-4">
                Page {currentPage} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                className="cursor-pointer"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                isActive={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
