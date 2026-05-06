import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Result } from "@/lib/types";
import { startTransition, useActionState, useEffect, useState } from "react";
import { AddPhoneNumberToNotification } from "./actions";
import { useToast } from "@/components/hooks/use-toast";
import { Loader2 } from "lucide-react";

type PharmacistDeniedSmsNotificationFormProps = {
  setResult?: React.Dispatch<React.SetStateAction<Result | undefined>>;
};

export default function PharmacistDeniedSmsNotificationForm({
  setResult = undefined,
}: PharmacistDeniedSmsNotificationFormProps) {
  const [result, dispatch] = useActionState(
    AddPhoneNumberToNotification,
    undefined,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const handleFormatPhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{1,3})(\d{1,3})?(\d{1,4})?$/);
    if (match) {
      const formattedNumber = [
        match[1],
        match[2] ? ` ${match[2]}` : "",
        match[3] ? ` ${match[3]}` : "",
      ].join("");
      setPhoneNumber(formattedNumber);
    } else {
      setPhoneNumber(cleaned);
    }
  };
  const { toast } = useToast();
  useEffect(() => {
    if (result === undefined) return;
    setResult?.(result);
    if (result.status === "success") {
      toast({
        title: "Success",
        description: "Phone number has been added to the notification",
      });
    } else if (result.status === "error") {
      toast({
        title: "Error",
        description: result.messages?.join(", ") ?? "An error occurred",
      });
    }
    setLoading(false);
  }, [result]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      dispatch(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="w-full">
          <Label>Name</Label>
          <Input type="text" name="name" placeholder="Enter name" required />
        </div>
        <div className="w-full">
          <Label>Phone Number</Label>
          <Input
            type="text"
            maxLength={12}
            name="phoneNumber"
            placeholder="Enter phone number"
            required
            value={phoneNumber}
            onChange={handleFormatPhoneNumber}
          />
        </div>
        <div className="mt-5">
          <Button
            variant="outline"
            className="w-14 cursor-pointer"
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </Button>
        </div>
      </div>
    </form>
  );
}
