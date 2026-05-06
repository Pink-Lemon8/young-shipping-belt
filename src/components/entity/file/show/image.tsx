"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dispatch, SetStateAction, use, useEffect, useState } from "react";
import { Result } from "@/lib/types";
import { getFilesByIDs } from "../actions";
import { ImageOffIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { File } from "../type";
type FileShowImageProps = {
  file?: File;
  setFile?: Dispatch<SetStateAction<File | undefined>>;
  width?: number;
  height?: number;
  className?: string;
};

export function FileShowImage({
  file,
  setFile,
  width = 1024,
  height = 1024,
  className,
}: FileShowImageProps) {
  const [result, setResult] = useState<Result | undefined>(undefined);
  const [preview, setPreview] = useState<any | undefined>(undefined);

  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  const fetchFile = async () => {
    setLoading(true);
    setReady(false);

    if (!file) {
      setPreview(undefined);
      setReady(true);
      setLoading(false);
      return;
    }

    if (file?.isPublic) {
      setPreview(file);
      setReady(true);
      setLoading(false);
      return;
    }

    const result = await getFilesByIDs([file?.id || -1]);
    setResult(result);
    if (result.status === "success") {
      setPreview(result.value[0]);
    }
    setReady(true);
    setLoading(false);
  };

  useEffect(() => {
    if (file !== undefined || preview === undefined) fetchFile();
  }, [file]);

  if (loading || !ready) return <FileShowImageSkeleton className={className} />;

  if (ready && preview === undefined)
    return <NoFileShowImageSkeleton className={className} />;

  return (
    <img
      src={preview.url}
      alt={preview.name}
      width={width}
      height={height}
      className={cn(
        "w-full h-full flex items-center justify-center overflow-hidden",
        className
      )}
    />
  );
}

export function FileShowImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center overflow-hidden",
        className
      )}
    >
      <Skeleton className="w-full h-full rounded-full" />
    </div>
  );
}

export function NoFileShowImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-accent",
        className
      )}
    >
      <ImageOffIcon className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}
