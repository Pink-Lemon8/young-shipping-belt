"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BCrumb from "./breadcrumb";
import { Navbar } from "@/components/layout/management/sidebar/navbar";

export default function EnterLot() {
  const [lotNumber, setLotNumber] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lotNumber) {
      setError("Lot number is required");
      return;
    }
    router.push(`/check-lot?lotNumber=${lotNumber}`);
  };

  return (
    <>
      <Navbar title="Lot Search" />
      <div className="container mx-auto my-10">
        <div className="flex flex-col items-center justify-center mt-10">
          <form
            onSubmit={handleSubmit}
            className="flex flex-row flex-wrap items-center justify-center gap-4"
          >
            <div className="flex flex-col items-center justify-center">
              <Input
                type="text"
                placeholder="Enter lot number"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
              />
              {error && <p className="text-red-500">{error}</p>}
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </div>
    </>
  );
}
