"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ImageAndMagnifier } from "@/components/common/image-and-magnifier";
import { ModelImageView } from "./show-picture/model-image-view";
import { getFiles } from "@/components/common/file/get";
import { Result } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/components/hooks/use-mobile";

export function ShowPicture({ images = undefined }: { images?: any[] }) {
  const width = 1920;
  const height = 1080;
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [currentImageSrc, setCurrentImageSrc] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    if (images && images?.length >= 0 && images[0]?.publicUrl) {
      setCurrentImageSrc(images[0]?.publicUrl);
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

  return (
    <>
      <Card className="w-full border-0 shadow-none">
        <CardContent className="p-0">
          {/* Thumbnail selector - horizontal scroll on mobile */}
          {images && images?.length > 1 && (
            <div className="flex flex-row items-center gap-2 mb-4 overflow-x-auto pb-2">
              {images.map((image: any, index: number) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20"
                >
                  <img
                    src={image?.publicUrl}
                    alt="Order picture"
                    width={width / 10}
                    height={height / 10}
                    className={`w-full h-full object-cover rounded-md cursor-pointer border-2 transition-all ${
                      currentImageSrc === image?.publicUrl
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    onClick={() => {
                      setLoading(true);
                      setCurrentImageSrc(image?.publicUrl);
                      setLoading(false);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {images && images[0]?.publicUrl === undefined && (
            <div className="w-full h-[60vh] md:h-[70vh] bg-muted rounded-md flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {/* Main image display - responsive height optimized for horizontal images */}
          <div className="relative w-full h-[50vh] md:h-[60vh] bg-muted rounded-md overflow-hidden">
            {currentImageSrc && !loading ? (
              isMobile ? (
                // On mobile: Show image with 230% default zoom for portrait content
                <div
                  ref={scrollContainerRef}
                  className="w-full h-full overflow-auto"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-x pan-y pinch-zoom",
                    position: "relative",
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      minWidth: "330%",
                      minHeight: "330%",
                      width: "330%",
                      height: "330%",
                    }}
                  >
                    <img
                      src={currentImageSrc}
                      alt="Order picture"
                      className="w-full h-full object-contain"
                      style={{
                        display: "block",
                        transform: "scale(1)",
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                </div>
              ) : (
                // On desktop: Use magnifier
                <ImageAndMagnifier
                  zoomScale={10}
                  lensSize={150}
                  src={currentImageSrc}
                  // width={width}
                  // height={height}
                  alt="Order picture"
                  containerClassName="w-full h-full"
                  className="w-full h-full object-contain"
                />
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
