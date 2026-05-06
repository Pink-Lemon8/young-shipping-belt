import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Home } from "lucide-react";
import Link from "next/link";

export default function UserNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <UserX className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>User Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            The requested user could not be found.
          </p>
          <Link href="/dashboard">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
