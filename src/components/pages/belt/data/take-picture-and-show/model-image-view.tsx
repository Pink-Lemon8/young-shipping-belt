"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCw, FilterX } from "lucide-react";
import { PanViewer } from "@/components/common/image-viewer";
import Image from "next/image";

type ModelImageViewProps = {
  imageSrc?: string | undefined;
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  width: number;
  height: number;
  rotation?: number;
  setRotation?: Dispatch<SetStateAction<number>>;
};

export function ModelImageView({
  imageSrc,
  open = false,
  setOpen = undefined,
  width,
  height,
  rotation = 0,
  setRotation = undefined,
}: ModelImageViewProps) {
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
    setRotation?.(0);
    setFlip(false);
  };

  const onPan = (dx: number, dy: number) => {
    setDx(dx);
    setDy(dy);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col justify-start min-w-[80vw] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>Order Picture</DialogTitle>
        </DialogHeader>
        <div className="flex w-full flex-row gap-4 justify-evenly">
          <Button variant="outline" onClick={handleReset} className="mt-2">
            <FilterX />
          </Button>
          <div className="flex w-full flex-col gap-4">
            <Label htmlFor="zoom">Zoom: {zoom.toFixed(2)}</Label>
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
          <div className="flex flex-row gap-4 justify-end">
            <Button
              variant="outline"
              className="bg-green-600 text-white hover:bg-green-700 hover:text-white"
              onClick={() => setOpen?.(false)}
            >
              Continue
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden w-full h-full border-4 border-emerald-500 rounded-lg">
          {imageSrc && (
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
                src={imageSrc}
                alt="Order picture"
                width={width}
                height={height}
              />
            </PanViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
