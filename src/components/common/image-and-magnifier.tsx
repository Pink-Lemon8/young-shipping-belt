"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";

interface ImageAndMagnifierProps extends React.ComponentPropsWithoutRef<"img"> {
  zoomScale?: number;
  containerClassName?: string;
  lensSize?: number;
  rotation?: number;
  defaultImageScale?: number;
}

const ImageAndMagnifier = React.forwardRef<
  React.ElementRef<"img">,
  ImageAndMagnifierProps
>(
  (
    {
      className,
      zoomScale = 2.5,
      containerClassName,
      lensSize = 150,
      rotation = 0,
      defaultImageScale = 1,
      ...props
    },
    ref
  ) => {
    const [isHovering, setIsHovering] = React.useState(false);
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    const [imageOffset, setImageOffset] = React.useState({ x: 0, y: 0 });
    const imageRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();

      // Calculate mouse position relative to image
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate lens position with boundary constraints
      let lensX = mouseX - lensSize / 2;
      let lensY = mouseY - lensSize / 2;

      // Keep lens within image boundaries
      lensX = Math.max(0, Math.min(lensX, rect.width - lensSize));
      lensY = Math.max(0, Math.min(lensY, rect.height - lensSize));

      // Calculate center point of the image
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate the actual scaled image dimensions
      const scaledWidth = rect.width * defaultImageScale;
      const scaledHeight = rect.height * defaultImageScale;

      // Calculate the offset for the scaled image (how much it extends beyond original bounds)
      const offsetX = (scaledWidth - rect.width) / 2;
      const offsetY = (scaledHeight - rect.height) / 2;

      // Calculate image translation to keep the magnified area visible
      let translateX = 0;
      let translateY = 0;

      if (defaultImageScale > 1) {
        // Calculate how much we need to translate to keep the mouse area visible
        const maxTranslateX = offsetX;
        const maxTranslateY = offsetY;

        // Map mouse position to translation (inverse relationship)
        translateX = -(mouseX / rect.width - 0.5) * maxTranslateX * 2;
        translateY = -(mouseY / rect.height - 0.5) * maxTranslateY * 2;

        // Clamp translation to prevent image from going too far
        translateX = Math.max(
          -maxTranslateX,
          Math.min(maxTranslateX, translateX)
        );
        translateY = Math.max(
          -maxTranslateY,
          Math.min(maxTranslateY, translateY)
        );
      }

      setImageOffset({ x: translateX, y: translateY });

      // Adjust mouse position to account for the scaled image and translation
      const adjustedMouseX = mouseX + offsetX - translateX;
      const adjustedMouseY = mouseY + offsetY - translateY;

      // Calculate mouse position relative to center for background positioning
      const relativeX = adjustedMouseX - centerX;
      const relativeY = adjustedMouseY - centerY;

      // Convert rotation to radians
      const rotationRad = (-rotation * Math.PI) / 180;

      // Apply rotation transformation
      const rotatedX =
        relativeX * Math.cos(rotationRad) - relativeY * Math.sin(rotationRad);
      const rotatedY =
        relativeX * Math.sin(rotationRad) + relativeY * Math.cos(rotationRad);

      // Calculate the background position to center the image under the mouse in the lens
      let bgX, bgY;

      if (rotation === 0) {
        // No rotation - use adjusted mouse position for scaled image
        bgX = (adjustedMouseX / scaledWidth) * 100;
        bgY = (adjustedMouseY / scaledHeight) * 100;
      } else {
        // With rotation - use the rotated coordinates
        bgX = ((rotatedX + centerX) / scaledWidth) * 100;
        bgY = ((rotatedY + centerY) / scaledHeight) * 100;
      }

      setMousePosition({ x: lensX, y: lensY });
      setBackgroundPosition({ x: bgX, y: bgY });
    };

    const [backgroundPosition, setBackgroundPosition] = React.useState({
      x: 0,
      y: 0,
    });

    return (
      <div
        className={cn("relative", containerClassName)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setImageOffset({ x: 0, y: 0 });
        }}
        onMouseMove={handleMouseMove}
        ref={imageRef}
      >
        <img
          ref={ref}
          className={cn(className)}
          style={{
            transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) rotate(${rotation}deg) scale(${defaultImageScale})`,
            transformOrigin: "center center",
            transition: "transform 0.1s ease-out",
          }}
          {...props}
        />
        {isHovering && (
          <div
            className="absolute rounded-full cursor-move pointer-events-none shadow-lg border-2 border-amber-600"
            style={{
              width: lensSize,
              height: lensSize,
              left: mousePosition.x,
              top: mousePosition.y,
              backgroundImage: `url(${props.src})`,
              backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${zoomScale * defaultImageScale * 100}%`,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          />
        )}
      </div>
    );
  }
);

ImageAndMagnifier.displayName = "ImageAndMagnifier";
export { ImageAndMagnifier };
