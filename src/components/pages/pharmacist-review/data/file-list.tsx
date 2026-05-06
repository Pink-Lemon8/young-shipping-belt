"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FileModel } from "@/components/common/file/model";

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

export function FileList({ files }: { files: any }) {
  const [file, setFile] = useState<any | undefined>(undefined);
  const [fileOpen, setFileOpen] = useState(false);

  const handleViewFile = (file: any) => {
    setFile(file);
    setFileOpen(true);
  };

  return (
    <>
      <FileModel
        file={file}
        setFile={setFile}
        open={fileOpen}
        setOpen={setFileOpen}
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Order Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="flex justify-center items-center py-4 text-muted-foreground">
              <p>No files available</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {files.map((file: any, index: any) => {
                const extension =
                  file.name.split(".").pop()?.toLowerCase() || "";
                const iconSrc =
                  fileIcons[extension] || "/icons/generic-file.svg";

                return (
                  <li
                    key={index}
                    className="flex items-center justify-between py-2 border rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      {iconSrc ? (
                        <img
                          src={iconSrc}
                          alt={`${extension} file`}
                          className="h-8 w-8 ml-2"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallbackEl = document.createElement("span");
                            fallbackEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
                            e.currentTarget.parentNode?.appendChild(fallbackEl);
                          }}
                        />
                      ) : (
                        <FileIcon className="h-6 w-6 text-blue-500" />
                      )}
                      <span className="text-sm truncate font-medium">
                        {file.name?.slice(0, 25)}
                        {file.name?.length > 25 && "..."}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleViewFile(file)}
                    >
                      <EyeIcon className="h-4 w-4" /> View
                    </Button>
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
