"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, ExternalLink, Plus, Upload } from "lucide-react";
import { useRef } from "react";
import { FileModel } from "@/components/common/file/model";
import {
  getMonographsForPackages,
  fetchAndStoreMonograph,
  createPackageExtras,
  uploadMonograph,
} from "../action";
import { useToast } from "@/components/hooks/use-toast";

const NON_MED_PACKAGE_IDS = ["17437", "17388", "17372", "17440", "17612"];

type MonographFileProps = {
  items: any[];
  pwMonographUrl?: string;
};

// Helper to check if item is a LymLight order (PP- prefix)
function isLymlightItem(item: any): boolean {
  return item.packageId?.startsWith("PP-");
}

// Get the numeric ID for monograph lookup
// For LymLight: use legacyId (e.g., "DP-16946" -> "16946")
// For PW: use packageId (e.g., "DP-16946" -> "16946")
function getMonographLookupId(item: any): string | undefined {
  if (isLymlightItem(item)) {
    // LymLight order - use legacyId if available
    return item.legacyId?.replace(/\D/g, "") || undefined;
  }
  // PW order - use packageId
  return item.packageId?.replace(/\D/g, "");
}

export function MonographFile({ items, pwMonographUrl }: MonographFileProps) {
  const [loading, setLoading] = useState(false);
  const [creatingExtras, setCreatingExtras] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [storedMonographs, setStoredMonographs] = useState<Record<string, { key: string; description: string }>>({});
  const [packageExtrasExists, setPackageExtrasExists] = useState<Record<string, boolean>>({});
  const [fileOpen, setFileOpen] = useState(false);
  const [viewFile, setViewFile] = useState<{ key?: string; url?: string; name: string } | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForPackageId, setUploadingForPackageId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if this is a LymLight order
  const isLymlightOrder = items.some(isLymlightItem);

  // Get med items (excluding non-med package IDs)
  const medItems = items.filter((item) => {
    const lookupId = getMonographLookupId(item);
    if (!lookupId) return true; // Keep items without lookup ID to show warning
    return !NON_MED_PACKAGE_IDS.includes(lookupId);
  });

  // For LymLight orders, check which items are missing legacyId
  const lymlightItemsMissingLegacyId = isLymlightOrder
    ? medItems.filter((item) => isLymlightItem(item) && !item.legacyId)
    : [];

  // Single med item - can store
  const isSingleMed = medItems.length === 1;
  const targetPackageId = isSingleMed ? medItems[0]?.packageId : undefined;
  const targetLegacyId = isSingleMed ? medItems[0]?.legacyId : undefined;

  useEffect(() => {
    async function fetchStoredMonographs() {
      if (medItems.length === 0) {
        setFetching(false);
        return;
      }

      // Get lookup IDs (legacyId for LymLight, packageId for PW)
      const packageIds = medItems
        .map((item) => {
          const lookupId = getMonographLookupId(item);
          // Return in DP-XXXXX format for the server action
          return lookupId ? `DP-${lookupId}` : null;
        })
        .filter((id): id is string => id !== null);

      if (packageIds.length === 0) {
        setFetching(false);
        return;
      }

      const result = await getMonographsForPackages(packageIds);
      
      if (result?.status === "success" && result.value) {
        const monographMap: Record<string, { key: string; description: string }> = {};
        const extrasExistMap: Record<string, boolean> = {};
        result.value.forEach((extra: any) => {
          // Track that package_extras row exists for this package
          extrasExistMap[extra.packageId.toString()] = true;
          if (extra.monographUrl) {
            // Find the item description for this package
            const item = medItems.find((i) => {
              const lookupId = getMonographLookupId(i);
              return lookupId === extra.packageId.toString();
            });
            monographMap[extra.packageId.toString()] = {
              key: extra.monographUrl,
              description: item?.description ?? "Drug Monograph",
            };
          }
        });
        setStoredMonographs(monographMap);
        setPackageExtrasExists(extrasExistMap);
      }
      setFetching(false);
    }

    fetchStoredMonographs();
  }, [items]);

  // Check if ALL med items have stored monographs (using legacyId for LymLight)
  const allMedItemsHaveMonographs = medItems.length > 0 && medItems.every((item) => {
    const lookupId = getMonographLookupId(item);
    if (!lookupId) return false; // Missing legacyId means no monograph
    return storedMonographs[lookupId] !== undefined;
  });

  // For single med item - use legacyId for LymLight orders
  const singleLookupId = isSingleMed ? getMonographLookupId(medItems[0]) : undefined;
  const singleStoredKey = singleLookupId
    ? storedMonographs[singleLookupId]?.key
    : undefined;

  const handleGetMonograph = async () => {
    // For LymLight orders, use legacyId; for PW orders, use packageId
    const packageIdForFetch = isLymlightOrder ? targetLegacyId : targetPackageId;
    if (!pwMonographUrl || !packageIdForFetch) return;

    setLoading(true);
    const result = await fetchAndStoreMonograph(pwMonographUrl, packageIdForFetch);
    
    if (result?.status === "success") {
      toast({
        title: "Success",
        description: "Monograph saved successfully",
      });
      if (result.value?.monographUrl) {
        const item = medItems[0];
        const lookupId = packageIdForFetch.replace(/\D/g, "");
        setStoredMonographs((prev) => ({
          ...prev,
          [lookupId]: {
            key: result.value.monographUrl,
            description: item?.description ?? "Drug Monograph",
          },
        }));
      }
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description: result?.messages?.join(", ") ?? "Failed to get monograph",
      });
    }
    setLoading(false);
  };

  const handleViewMonograph = (key: string, name: string) => {
    setViewFile({ key, name });
    setFileOpen(true);
  };

  const handleCreatePackageExtras = async (lookupId: string) => {
    setCreatingExtras(true);
    const result = await createPackageExtras(lookupId);
    
    if (result?.status === "success") {
      toast({
        title: "Success",
        description: "Package extras created successfully",
      });
      setPackageExtrasExists((prev) => ({
        ...prev,
        [lookupId]: true,
      }));
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description: result?.messages?.join(", ") ?? "Failed to create package extras",
      });
    }
    setCreatingExtras(false);
  };

  const handleUploadClick = (packageId: string) => {
    setUploadingForPackageId(packageId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingForPackageId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadMonograph(uploadingForPackageId, formData);
    
    if (result?.status === "success") {
      toast({
        title: "Success",
        description: "Monograph uploaded successfully",
      });
      if (result.value?.monographUrl) {
        const item = medItems.find((i) => getMonographLookupId(i) === uploadingForPackageId);
        setStoredMonographs((prev) => ({
          ...prev,
          [uploadingForPackageId]: {
            key: result.value.monographUrl,
            description: item?.description ?? "Drug Monograph",
          },
        }));
        setPackageExtrasExists((prev) => ({
          ...prev,
          [uploadingForPackageId]: true,
        }));
      }
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description: result?.messages?.join(", ") ?? "Failed to upload monograph",
      });
    }
    
    setUploading(false);
    setUploadingForPackageId(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // No med items - don't show component
  if (medItems.length === 0) {
    return null;
  }

  // For LymLight orders: show component if we have stored monographs OR need to show warning
  // For PW orders: need pwMonographUrl
  const hasStoredMonographs = Object.keys(storedMonographs).length > 0;
  if (!isLymlightOrder && !pwMonographUrl) {
    return null;
  }

  if (fetching) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Drug Monograph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <FileModel
        file={viewFile}
        setFile={() => setViewFile(undefined)}
        open={fileOpen}
        setOpen={setFileOpen}
      />
      {/* Hidden file input for upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Drug Monograph
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Show warning for LymLight items missing legacyId */}
          {lymlightItemsMissingLegacyId.length > 0 && (
            <div className="flex items-start gap-3 py-2 border rounded-md p-3 border-dashed border-amber-500 bg-amber-50">
              <FileText className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-amber-800">
                  Legacy ID Missing
                </span>
                <span className="text-xs text-amber-700">
                  Please add legacy ID to {lymlightItemsMissingLegacyId.map(i => i.packageId).join(", ")} in Lymlight to enable auto monograph lookup.
                </span>
              </div>
            </div>
          )}

          {isSingleMed ? (
            // Single med item - can store
            singleStoredKey ? (
              <div className="flex items-center justify-between py-2 border rounded-md p-3">
                <div className="flex items-center space-x-3">
                  <img src="/icons/pdf.svg" alt="PDF" className="h-8 w-8" />
                  <span className="text-sm font-medium">Drug Monograph</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewMonograph(singleStoredKey, "Drug Monograph.pdf")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" /> View
                </Button>
              </div>
            ) : lymlightItemsMissingLegacyId.length > 0 ? (
              // LymLight item without legacyId - warning already shown above
              null
            ) : pwMonographUrl ? (
              <div className="flex items-center justify-between py-2 border rounded-md p-3 border-dashed">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    No monograph stored for this package
                  </span>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGetMonograph}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Get Monograph
                </Button>
              </div>
            ) : isLymlightOrder && singleLookupId ? (
              // LymLight order with legacyId but no stored monograph
              <div className="flex items-center justify-between py-2 border rounded-md p-3 border-dashed">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {packageExtrasExists[singleLookupId]
                      ? `Upload monograph for DP-${singleLookupId}`
                      : `Package extras not found for DP-${singleLookupId}`}
                  </span>
                </div>
                {!packageExtrasExists[singleLookupId] ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleCreatePackageExtras(singleLookupId)}
                    disabled={creatingExtras}
                  >
                    {creatingExtras ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Create Package Extras
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUploadClick(singleLookupId)}
                    disabled={uploading && uploadingForPackageId === singleLookupId}
                  >
                    {uploading && uploadingForPackageId === singleLookupId ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    Upload Monograph
                  </Button>
                )}
              </div>
            ) : null
          ) : allMedItemsHaveMonographs ? (
            // Multiple med items AND we have ALL stored - show individual files
            medItems.map((item) => {
              const lookupId = getMonographLookupId(item);
              if (!lookupId) return null;
              const stored = storedMonographs[lookupId];
              if (!stored) return null;
              
              return (
                <div
                  key={item.packageId}
                  className="flex items-center justify-between py-2 border rounded-md p-3"
                >
                  <div className="flex items-center space-x-3">
                    <img src="/icons/pdf.svg" alt="PDF" className="h-8 w-8" />
                    <span className="text-sm font-medium line-clamp-1">
                      {stored.description}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewMonograph(stored.key, `${stored.description}.pdf`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              );
            })
          ) : pwMonographUrl ? (
            // Multiple med items but missing some - show combined PW link
            <div className="flex items-center justify-between py-2 border rounded-md p-3">
              <div className="flex items-center space-x-3">
                <img src="/icons/pdf.svg" alt="PDF" className="h-8 w-8" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Drug Monograph (Combined)</span>
                  <span className="text-xs text-muted-foreground">
                    {medItems.length} medications
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={pwMonographUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> View
                </a>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
