import { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";
import InfoForm from "./form";
import { Result } from "@/lib/types";

type InfoCardProps = {
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function InfoCard({ setResult }: InfoCardProps) {
  const [result, dispacthResult] = useState<Result | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setResult?.(result);
    if (result?.status === "success") setEditing(false);
  }, [result]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Manage your personal information and account details
            </CardDescription>
          </div>
          {!editing ? (
            <Button
              className="cursor-pointer group w-20"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <PencilLine className="h-4 w-4 group-hover:animate-pulse" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                className="cursor-pointer w-20 text-white"
                disabled={loading}
                variant="destructive"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <InfoForm
          disabled={!editing}
          setDisabled={setEditing}
          loading={loading}
          setLoading={setLoading}
          setResult={dispacthResult}
        />
      </CardContent>
    </Card>
  );
}
