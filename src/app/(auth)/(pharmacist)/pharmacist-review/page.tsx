import { Suspense } from "react";
import { connection } from "next/server";
import PharmacistReviewDefault from "@/components/pages/pharmacist-review/default";
import { getConfig } from "@/server/controller/config";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function PharmacistReviewContent() {
  await connection();
  const notDrugPackages = await getConfig("NOT_DRUG_PACKAGES");
  return (
    <PharmacistReviewDefault notDrugPackages={notDrugPackages?.value}>
      <></>
    </PharmacistReviewDefault>
  );
}

export default function PharmacistReviewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PharmacistReviewContent />
    </Suspense>
  );
}
