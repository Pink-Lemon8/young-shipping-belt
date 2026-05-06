"use client";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  affiliateShippingPreferences,
  affiliateStatusTypes,
  loginTypes,
  roleTypes,
  statusTypes,
} from "@/db/schema";
import { Result } from "@/lib/types";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Terminal } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast";
import { uploadExtraFiles } from "./action";
import { useFormStatus } from "react-dom";
import { Switch } from "@/components/ui/switch";

type UploadExtraFileFormProps = {
  orderId?: string;
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export function UploadExtraFileForm({
  setResult = undefined,
  orderId,
}: UploadExtraFileFormProps) {
  const [response, dispatch] = useActionState<Result | undefined, FormData>(
    uploadExtraFiles,
    undefined
  );

  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  useEffect(() => {
    if (response !== undefined) {
      setResult?.(response);
      if (response.status === "success") {
        toast({
          title: "Action successful",
          description: "File has been added successfully",
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
    startTransition(() => {
      dispatch(formData);
    });
  };

  return (
    <>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {response && response.status === "error" && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>
              Error
              {(response?.messages?.length ?? 0) > 1 ? "s" : ""}{" "}
              !
            </AlertTitle>
            <AlertDescription>
              {response?.messages?.map((message: string) => (
                <p key={message}>{message}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <Label htmlFor="file">File</Label>
          <Input
            required
            id="file"
            type="file"
            name="file"
            placeholder="Enter file"
            className="col-span-3"
          />
        </div>

        <Button disabled={loading} type="submit">
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Adding...
            </>
          ) : (
            "Add"
          )}
        </Button>
      </form>
    </>
  );
}
