"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Result } from "@/lib/types";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast";
import { uploadStageImage } from "./action";

type UploadStageImageFormProps = {
  orderId?: string;
  defaultStage?: "1" | "2" | "3";
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function UploadStageImageForm({
  orderId,
  defaultStage = "1",
  setResult,
}: UploadStageImageFormProps) {
  const [response, dispatch] = useActionState<Result | undefined, FormData>(
    uploadStageImage,
    undefined,
  );
  const [stage, setStage] = useState<"1" | "2" | "3">(defaultStage);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (response !== undefined) {
      setResult?.(response);
      if (response.status === "success") {
        toast({
          title: "Image uploaded",
          description: response.messages?.join(", ") ?? "Stage image uploaded",
        });
      }
      setLoading(false);
    }
  }, [response]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    if (orderId) formData.append("orderId", orderId);
    formData.append("stage", stage);
    startTransition(() => {
      dispatch(formData);
    });
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {response && response.status === "error" && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>
            Error{(response?.messages?.length ?? 0) > 1 ? "s" : ""}!
          </AlertTitle>
          <AlertDescription>
            {response?.messages?.map((m: string) => (
              <p key={m}>{m}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="stage">Stage</Label>
        <Select
          value={stage}
          onValueChange={(v) => setStage(v as "1" | "2" | "3")}
        >
          <SelectTrigger id="stage">
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Stage 1</SelectItem>
            <SelectItem value="2">Stage 2</SelectItem>
            <SelectItem value="3">Stage 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file">Image</Label>
        <Input
          required
          id="file"
          type="file"
          name="file"
          accept="image/*"
          className="col-span-3"
        />
      </div>

      <Button disabled={loading} type="submit">
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Uploading...
          </>
        ) : (
          "Upload"
        )}
      </Button>
    </form>
  );
}
