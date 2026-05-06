import { SignupCard } from "@/components/pages/sign-up/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LimeLight - Sign Up",
  description: "Create a new LimeLight account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Pinklemon8 INC</h1>
          <p className="text-muted-foreground mt-2">Management System</p>
        </div>
        <SignupCard />
      </div>
    </div>
  );
}
