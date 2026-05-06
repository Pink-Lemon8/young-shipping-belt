"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ImageAndMagnifier } from "@/components/common/image-and-magnifier";
import { ModelImageView } from "./show-picture/model-image-view";
import { getFiles } from "@/components/common/file/get";
import { Result } from "@/lib/types";
import { FilterX, Loader2, RotateCw } from "lucide-react";
import { useIsMobile } from "@/components/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import PanViewer from "@/components/common/image-viewer/PanViewer";
import { Skeleton } from "@/components/ui/skeleton";

// Cache localStorage reads in memory (Rule 7.4)
const storageCache = new Map<string, string | null>();

function getCachedLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (!storageCache.has(key)) {
    storageCache.set(key, localStorage.getItem(key));
  }
  return storageCache.get(key) ?? null;
}

function setCachedLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
  storageCache.set(key, value);
}

export function ShowPicture({ images = undefined }: { images?: any[] }) {
  const width = 1920 * 2;
  const height = 1080 * 2;
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [currentImageSrc, setCurrentImageSrc] = useState<string | undefined>(
    undefined
  );
  const [publicImages, setPublicImages] = useState<any[] | undefined>(
    undefined
  );
  const mobileImageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (images && images?.length > 0) {
      getFiles(images.map((image: any) => image.key)).then((res: Result) => {
        if (res.status === "success") {
          const sortedImages = res.value.sort((a: any, b: any) => -1);
          setPublicImages(sortedImages);
          setCurrentImageSrc(sortedImages?.[0]?.url);
        }
      });
    }
  }, [images]);

  // Auto-center the zoomed image on mobile
  useEffect(() => {
    if (isMobile && currentImageSrc && scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const scrollLeft =
            (container.scrollWidth - container.clientWidth) / 2;
          const scrollTop =
            (container.scrollHeight - container.clientHeight) / 2;
          container.scrollLeft = scrollLeft;
          container.scrollTop = scrollTop;
        }
      }, 100);
    }
  }, [currentImageSrc, isMobile]);

  const getImageViewerValues = () => {
    const viewerZoom = getCachedLocalStorage("imageViewer");
    if (viewerZoom) {
      return JSON.parse(viewerZoom);
    }
    return {
      desktopImageScale: 1.0,
      desktopMagnifierZoom: 10,
      desktopMagnifierLensSize: 150,
      mobileZoom: 100,
    };
  };

  const minDesktopMagnifierZoom = 5.0;
  const maxDesktopMagnifierZoom = 50.0;

  const minDesktopMagnifierLensSize = 100.0;
  const maxDesktopMagnifierLensSize = 350.0;

  const minDesktopImageScale = 1.0;
  const maxDesktopImageScale = 2.5;

  const minMobileZoom = 100.0;
  const maxMobileZoom = 700.0;

  const [desktopImageScale, setDesktopImageScale] = useState<number>(
    getImageViewerValues().desktopImageScale
  );

  const [desktopMagnifierZoom, setDesktopMagnifierZoom] = useState<number>(
    getImageViewerValues().desktopMagnifierZoom
  );
  const [desktopMagnifierLensSize, setDesktopMagnifierLensSize] =
    useState<number>(getImageViewerValues().desktopMagnifierLensSize);

  const [mobileZoom, setMobileZoom] = useState<number>(
    getImageViewerValues().mobileZoom
  );

  const handleReset = () => {
    setDesktopImageScale(1.0);
    setDesktopMagnifierZoom(10.0);
    setDesktopMagnifierLensSize(150.0);
    setMobileZoom(100.0);
    saveZoomAndLensSize();
  };
  const saveZoomAndLensSize = () => {
    const viewerZoom = {
      desktopImageScale: desktopImageScale,
      desktopMagnifierZoom: desktopMagnifierZoom,
      desktopMagnifierLensSize: desktopMagnifierLensSize,
      mobileZoom: mobileZoom,
    };
    setCachedLocalStorage("imageViewer", JSON.stringify(viewerZoom));
  };

  useEffect(() => {
    saveZoomAndLensSize();
  }, [
    desktopImageScale,
    desktopMagnifierZoom,
    desktopMagnifierLensSize,
    mobileZoom,
  ]);

  return (
    <>
      <Card className="w-full shadow-none">
        <CardContent className="p-1 sm:p-4">
          {/* Thumbnail selector - horizontal scroll on mobile */}
          {publicImages && publicImages?.length > 1 && (
            <div className="flex flex-row items-center gap-2 mb-4 overflow-x-auto py-2 px-2 border-b-2 border-muted">
              {publicImages.map((image: any, index: number) => (
                <div
                  key={index}
                  className={`w-16 h-16 md:w-20 md:h-20 relative rounded-md overflow-hidden cursor-pointer border-4 transition-all ${
                    currentImageSrc === image?.url
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                  onClick={() => {
                    setLoading(true);
                    setCurrentImageSrc(image?.url);
                    setLoading(false);
                  }}
                >
                  <Image
                    src={image?.url}
                    alt="Order picture"
                    fill
                    sizes="(max-width: 768px) 64px, 80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {images && publicImages === undefined && (
            <div>
              <div className="flex flex-row items-center gap-2 mb-4 overflow-x-auto py-2 px-2 border-b-2 border-muted">
                {images.map((image: any, index: number) => (
                  <div key={index} className="w-16 h-16 md:w-20 md:h-20">
                    <Skeleton className="w-full h-full" />
                  </div>
                ))}
              </div>

              <div className="w-full h-[40vh] md:h-[50vh] bg-destructive/20 rounded-md flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
          )}

          {!isMobile && !loading && currentImageSrc && (
            <div className="duration-300 top-0 left-0 flex w-full flex-row gap-2 justify-evenly p-2 z-10">
              <Button variant="outline" onClick={handleReset} className="mt-2">
                <FilterX />
              </Button>
              <div className="flex w-full flex-col gap-2 mt-2">
                <Label htmlFor="zoom" className="text-xs">
                  Magnifier Zoom: {desktopMagnifierZoom.toFixed(2)}
                </Label>
                <Slider
                  id="zoom"
                  value={[desktopMagnifierZoom ?? 1]}
                  onValueChange={(value) => setDesktopMagnifierZoom(value[0])}
                  max={maxDesktopMagnifierZoom}
                  min={minDesktopMagnifierZoom}
                  step={0.5}
                />
              </div>
              <div className="flex w-full flex-col gap-2 mt-2">
                <Label htmlFor="zoom" className="text-xs">
                  Magnifier Lens Size: {desktopMagnifierLensSize.toFixed(2)}
                </Label>
                <Slider
                  id="zoom"
                  value={[desktopMagnifierLensSize ?? 1]}
                  onValueChange={(value) =>
                    setDesktopMagnifierLensSize(value[0])
                  }
                  max={maxDesktopMagnifierLensSize}
                  min={minDesktopMagnifierLensSize}
                  step={0.5}
                />
              </div>
              <div className="flex w-full flex-col gap-2 mt-2">
                <Label htmlFor="zoom" className="text-xs">
                  Image Scale: {desktopImageScale.toFixed(2)}
                </Label>
                <Slider
                  id="zoom"
                  value={[desktopImageScale ?? 1]}
                  onValueChange={(value) => setDesktopImageScale(value[0])}
                  max={maxDesktopImageScale}
                  min={minDesktopImageScale}
                  step={0.01}
                />
              </div>
            </div>
          )}

          {isMobile && !loading && currentImageSrc && (
            <div className="duration-300 top-0 left-0 flex w-full flex-row gap-2 justify-evenly p-2 z-10">
              <Button variant="outline" onClick={handleReset} className="mt-2">
                <FilterX />
              </Button>
              <div className="flex w-full flex-col gap-2 mt-2">
                <Label htmlFor="zoom" className="text-xs">
                  Zoom: {mobileZoom.toFixed(2)}
                </Label>
                <Slider
                  id="zoom"
                  value={[mobileZoom ?? 1]}
                  onValueChange={(value) => setMobileZoom(value[0])}
                  max={maxMobileZoom}
                  min={minMobileZoom}
                  step={0.5}
                />
              </div>
            </div>
          )}

          {/* Main image display - responsive height optimized for horizontal images */}
          <div className="relative w-full bg-muted rounded-md overflow-hidden">
            {currentImageSrc && !loading ? (
              isMobile ? (
                <div
                  ref={scrollContainerRef}
                  className="w-full max-h-[50vh] overflow-auto"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-x pan-y pinch-zoom",
                    position: "relative",
                  }}
                >
                  <div
                    ref={mobileImageContainerRef}
                    className="flex items-center justify-center relative"
                    style={{
                      minWidth: `${mobileZoom}%`,
                      minHeight: `${mobileZoom}%`,
                      width: `${mobileZoom}%`,
                      height: `${mobileZoom}%`,
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault(); // Prevent default touch behavior
                      document.body.style.touchAction = "none"; // Disable zoom on the entire page
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault(); // Prevent default touch behavior
                      document.body.style.touchAction = "auto"; // Re-enable zoom on the entire page
                    }}
                  >
                    <img
                      src={currentImageSrc}
                      alt="Order picture"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full h-full">
                    <ImageAndMagnifier
                      zoomScale={desktopMagnifierZoom}
                      lensSize={desktopMagnifierLensSize}
                      src={currentImageSrc}
                      alt="Order picture"
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                      defaultImageScale={desktopImageScale}
                    />
                  </div>
                </>
              )
            ) : (
              loading && (
                <div className="w-full h-full flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
