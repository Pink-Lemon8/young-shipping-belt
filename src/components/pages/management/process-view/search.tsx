import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

type SearchProps = {
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
  placeholder?: string;
  currentPage?: number;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
};

export default function Search({
  className,
  placeholder = "Search",
  searchText,
  setSearchText,
  currentPage,
  setCurrentPage,
}: SearchProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const currentSearchParam = searchParams.get("search") ?? "";
      if (value === currentSearchParam) {
        return;
      }

      setCurrentPage?.(1);
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
        params.set("page", "1");
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }, 400);
  };

  return (
    <Input
      type="search"
      value={searchText}
      onChange={searchHandler}
      placeholder={placeholder}
      className={className}
    />
  );
}
