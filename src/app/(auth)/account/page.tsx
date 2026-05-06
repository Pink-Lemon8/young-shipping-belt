"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecurityCard from "@/components/pages/account/profile/security/card";
import InfoCard from "@/components/pages/account/profile/info/card";
import BCrumb from "./breadcrumb";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isSaved) {
      const timer = setTimeout(() => {
        setIsSaved(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  const handleSave = () => {
    setIsSaved(true);
  };

  return (
    <Card className="rounded-lg border-none mt-6">
      <CardContent className="p-4">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* {isSaved && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Settings have been saved successfully.</AlertDescription>
        </Alert>
      )} */}

          <InfoCard />

          <SecurityCard />
        </div>
      </CardContent>
    </Card>
  );
}
