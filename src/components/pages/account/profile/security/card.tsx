"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { PencilLine } from "lucide-react";
import ChangePassword from "./change-password";
import Profile2FA from "./2fa";
import { Result } from "@/lib/types";
import ProfilePasskey from "./passkey";

type SecurityCardProps = {
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function SecurityCard({ setResult }: SecurityCardProps) {
  const [editing, setEditing] = useState(false);
  const [result, dispacthResult] = useState<Result | undefined>(undefined);

  useEffect(() => {
    setResult?.(result);
    if (result?.status === "success") setEditing(false);
  }, [result]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and account security settings
              </CardDescription>
            </div>
            {!editing ? (
              <Button
                className="cursor-pointer group w-20"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                <PencilLine className="h-4 w-4 group-hover:animate-pulse" />{" "}
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="cursor-pointer w-20 text-white"
                  variant="destructive"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChangePassword disabled={!editing} setResult={dispacthResult} />

          <Separator />

          <Profile2FA disabled={!editing} setResult={dispacthResult} />

          <ProfilePasskey
            disabled={!editing}
            setDisabled={setEditing}
            setResult={dispacthResult}
          />
        </CardContent>
      </Card>
    </>
  );
}
