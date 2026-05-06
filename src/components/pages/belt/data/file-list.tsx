"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileIcon, EyeIcon, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FileModel } from "@/components/common/file/model";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteQueueFile } from "@/components/pages/management/process-view/info/delete-file-action";
import { toast } from "sonner";

// File type icons for different extensions
const fileIcons: Record<string, string> = {
  pdf: "/icons/pdf.svg",
  doc: "/icons/doc.svg",
  docx: "/icons/doc.svg",
  xls: "/icons/xls.svg",
  xlsx: "/icons/xls.svg",
  jpg: "/icons/jpg.svg",
  jpeg: "/icons/jpg.svg",
  png: "/icons/png.svg",
  gif: "/icons/gif.svg",
  txt: "/icons/txt.svg",
  csv: "/icons/csv.svg",
};

export function FileList({
  listTitle,
  files,
  orderId,
  onFileDeleted,
}: {
  listTitle?: string;
  files: any;
  orderId?: string;
  onFileDeleted?: () => void;
}) {
  const [file, setFile] = useState<any | undefined>(undefined);
  const [fileOpen, setFileOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewFile = (file: any) => {
    setFile(file);
    setFileOpen(true);
  };

  const handleDeleteClick = (file: any) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete?.key) {
      toast.error("File key not found");
      return;
    }

    if (!orderId) {
      toast.error("Order ID not found");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteQueueFile(orderId, fileToDelete.key);
      if (result.status === "success") {
        toast.success("File deleted successfully");
        onFileDeleted?.();
      } else {
        toast.error(result.messages?.[0] || "Failed to delete file");
      }
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setFileToDelete(undefined);
    }
  };

  return (
    <>
      <FileModel
        file={file}
        setFile={setFile}
        open={fileOpen}
        setOpen={setFileOpen}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{listTitle ?? "Order Files"}</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="flex justify-center items-center py-4 text-muted-foreground">
              <p>No files available</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {files
                .filter(
                  (file: any) =>
                    file !== undefined && file !== null && file.name,
                )
                .map((file: any, index: any) => {
                  const extension =
                    file.name.split(".").pop()?.toLowerCase() || "";
                  const iconSrc =
                    fileIcons[extension] || "/icons/generic-file.svg";

                  return (
                    <li
                      key={index}
                      className="flex items-center justify-between py-2 border rounded-md p-3"
                    >
                      <div className="flex items-center space-x-2 w-full truncate">
                        {/* Use either an image for the icon or fallback to the FileIcon */}
                        {iconSrc ? (
                          <img
                            src={iconSrc}
                            alt={`${extension} file`}
                            className="h-8 w-8"
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.style.display = "none";
                              const fallbackEl = document.createElement("span");
                              fallbackEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
                              e.currentTarget.parentNode?.appendChild(
                                fallbackEl,
                              );
                            }}
                          />
                        ) : (
                          <FileIcon className="h-6 w-6 text-blue-500" />
                        )}
                        <span
                          className="text-sm font-medium line-clamp-1 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFile(file)}
                        >
                          <EyeIcon className="h-4 w-4 mr-0 md:mr-1" /> <span className="hidden md:block">View</span>
                        </Button>
                        {orderId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(file)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
