"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Image from "next/image";
import { ImageAndMagnifier } from "@/components/common/image-and-magnifier";
import { ModelImageView } from "./take-picture-and-show/model-image-view";
import { getFiles } from "@/components/common/file/get";
import { Result } from "@/lib/types";
import {
  FilterX,
  Loader2,
  RotateCw,
  Maximize2,
  CameraIcon,
  RefreshCwIcon,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PanViewer } from "@/components/common/image-viewer";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function TakePictureAndShow({
  images = undefined,
  taken = false,
  setTaken = undefined,
  setResult = undefined,
  readyToPicture = false,
  setReadyToPicture = undefined,
}: {
  images?: any[];
  taken?: boolean;
  setTaken?: React.Dispatch<React.SetStateAction<boolean>>;
  setResult?: React.Dispatch<React.SetStateAction<any>>;
  readyToPicture?: boolean;
  setReadyToPicture?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const width = 1920 * 1.5;
  const height = 1080 * 1.5;

  const [currentImageSrc, setCurrentImageSrc] = useState<string | undefined>(
    undefined
  );
  const [publicImages, setPublicImages] = useState<any[] | undefined>(
    undefined
  );

  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);

  const webcamRef = useRef<any>();
  const blankRequestedRef = useRef<boolean>(false);

  const [imageOpen, setImageOpen] = useState<boolean>(false);

  const [rotation, setRotation] = useState<number>(0);

  const maxZoom = 10;
  const minZoom = 0.1;

  const [zoom, setZoom] = useState<number>(1);
  const [dx, setDx] = useState<number>(0);
  const [dy, setDy] = useState<number>(0);
  const [flip, setFlip] = useState<boolean>(false);

  const handleZoomScaleChange = (value: number) => {
    setZoom(Math.min(Math.max(minZoom, value), maxZoom));
  };

  const handleRotationChange = () => {
    const newRotation = rotation + 90;
    const clampedRotation = newRotation % 360;
    setRotation?.(clampedRotation);
  };

  const handleReset = () => {
    setZoom(1);
    setDx(0);
    setDy(0);
    setRotation?.(180);
    setFlip(false);
  };

  const onPan = (dx: number, dy: number) => {
    setDx(dx);
    setDy(dy);
  };

  const handleTakePicture = async () => {
    const takenImageBase64 = (webcamRef.current as any)?.getScreenshot();
    if (takenImageBase64 && takenImageBase64?.length > 0) {
      setRotation(180);
      setImageBase64(takenImageBase64);
      setCurrentImageSrc(takenImageBase64);
      setResult?.(takenImageBase64);
      setImageOpen(true);
    } else {
      setTaken?.(false);
    }
  };

  const handleRemovePicture = () => {
    setTaken?.(false);
    setImageBase64(undefined);
    setCurrentImageSrc(undefined);
    setResult?.(undefined);
    setRotation(0);
  };

  const handleAddBlankImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    const blankBase64 = canvas.toDataURL("image/jpeg", 1);
    blankRequestedRef.current = true;
    setRotation(0);
    setImageBase64(blankBase64);
    setCurrentImageSrc(blankBase64);
    setResult?.(blankBase64);
    setImageOpen(false);
    setTaken?.(true);
  };

  useEffect(() => {
    if (taken) {
      if (blankRequestedRef.current) {
        blankRequestedRef.current = false;
        return;
      }
      handleTakePicture().then(() => {});
    } else {
      handleRemovePicture();
    }
  }, [taken]);

  useEffect(() => {
    if (images && images?.length > 0) {
      getFiles(images.map((image: any) => image.key)).then((res: Result) => {
        if (res.status === "success") {
          const sortedImages = res.value.sort((a: any, b: any) => -1);
          setPublicImages(sortedImages);
        }
      });
    }
  }, [images]);

  return (
    <>
      <ModelImageView
        imageSrc={currentImageSrc}
        open={imageOpen}
        rotation={rotation}
        setRotation={setRotation}
        setOpen={setImageOpen}
        width={width}
        height={height}
      />
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-row justify-between items-center gap-2">
            <span>Order Picture display</span>
            <div className="mr-4 flex items-center gap-2">
              {!taken ? (
                <>
                  <Button
                    disabled={!readyToPicture}
                    onClick={() => setTaken?.(true)}
                    className="gap-2 cursor-pointer"
                  >
                    <CameraIcon className="min-h-5 min-w-5" />
                    Take Picture
                  </Button>
                  <Button
                    disabled={!readyToPicture}
                    onClick={handleAddBlankImage}
                    variant="outline"
                    className="gap-2 cursor-pointer"
                  >
                    <ImageOff className="min-h-5 min-w-5" />
                    Add Blank Image
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setTaken?.(false)}
                    disabled={!readyToPicture}
                    variant="outline"
                    className="gap-2 cursor-pointer"
                  >
                    <RefreshCwIcon className="min-h-5 min-w-5" />
                    Retake Picture
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted relative rounded-md">
            {!imageBase64 ? (
              <div className="w-full h-full overflow-hidden border-4 border-red-600 rounded-lg">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  minScreenshotHeight={height}
                  minScreenshotWidth={width}
                  autoFocus={true}
                  screenshotQuality={1}
                  videoConstraints={{
                    height: height,
                    width: width,
                    facingMode: "environment",
                  }}
                  className="rotate-180"
                  screenshotFormat="image/jpeg"
                />
              </div>
            ) : undefined}

            {taken && imageBase64 !== undefined ? (
              <div className="border-4 border-green-600 overflow-hidden rounded-lg w-full h-full">
                <div className="absolute opacity-40 hover:opacity-100 transition-opacity duration-300 top-0 left-0 flex w-full flex-row gap-2 justify-evenly p-2 z-10">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="mt-2"
                  >
                    <FilterX />
                  </Button>
                  <div className="flex w-full flex-col gap-2 mt-2">
                    <Label htmlFor="zoom" className="text-xs">
                      Zoom: {zoom.toFixed(2)}
                    </Label>
                    <Slider
                      id="zoom"
                      value={[zoom ?? 1]}
                      onValueChange={(value) => handleZoomScaleChange(value[0])}
                      max={maxZoom}
                      min={minZoom}
                      step={0.01}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRotationChange}
                    className="mt-1"
                  >
                    <RotateCw />
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-1"
                    onClick={() => {
                      setRotation(180);
                      setImageOpen(true);
                    }}
                  >
                    <Maximize2 />
                  </Button>
                </div>
                <PanViewer
                  minZoom={minZoom}
                  maxZoom={maxZoom}
                  zoom={zoom}
                  setZoom={setZoom}
                  pandx={dx}
                  pandy={dy}
                  onPan={onPan}
                  rotation={rotation}
                  key={dx}
                >
                  <img
                    style={{
                      transform: `rotate(${rotation}deg) scaleX(${flip ? -1 : 1})`,
                      width: "100%",
                    }}
                    src={imageBase64}
                    alt="Order picture"
                    width={width}
                    height={height}
                  />
                </PanViewer>
              </div>
            ) : undefined}
          </div>

          <div className="flex flex-row items-center gap-2 mt-4">
            {publicImages && publicImages?.length > 0 ? (
              <>
                {publicImages?.map((image: any, index: number) => (
                  <div
                    key={index}
                    className="flex w-12 h-12 flex-row justify-between items-center"
                  >
                    <img
                      src={image?.url}
                      alt="Order picture"
                      width={width / 10}
                      height={height / 10}
                      className="w-full h-full object-cover rounded-sm cursor-pointer"
                      onClick={() => {
                        setCurrentImageSrc(image?.url);
                        setImageOpen(true);
                      }}
                    />
                  </div>
                ))}
              </>
            ) : undefined}

            {images && publicImages === undefined ? (
              <div className="w-full h-12 bg-muted rounded-md overflow-hidden object-cover flex justify-center items-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : undefined}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
