"use client";

import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PageNumber({
  totalPages,
  paginationButtonRange = 5,
  currentPage = 1,
  setCurrentPage = undefined,
  scrollToTop = false,
}: {
  totalPages: number;
  paginationButtonRange?: number;
  currentPage?: number;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
  scrollToTop?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    setCurrentPage?.(page);
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
    if (scrollToTop) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Pagination className="mt-4">
      <PaginationContent className="overflow-hidden">
        <PaginationItem>
          <PaginationPrevious
            className={cn("cursor-pointer")}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, index) => {
          const rangeDown = Math.max(currentPage - paginationButtonRange, 1);
          const rangeUp = Math.min(
            currentPage + paginationButtonRange,
            totalPages
          );

          if (index + 1 >= rangeDown && index + 1 <= rangeUp) {
            return (
              <PaginationItem key={index}>
                <PaginationLink
                  className="cursor-pointer"
                  onClick={() => handlePageChange(index + 1)}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            );
          }
          return null;
        })}
        <PaginationItem>
          <PaginationNext
            className={cn("cursor-pointer")}
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
