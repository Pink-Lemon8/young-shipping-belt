"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cages } from "@/lib/const";
import { useEffect, useState } from "react";
import { getAllCagesLengthAction } from "./action";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function GridCage({ selectedCage, setSelectedCage, loading }: {
    selectedCage: number | undefined,
    setSelectedCage: React.Dispatch<React.SetStateAction<number | undefined>>,
    loading: boolean,
}) {
    const [cagesLength, setCagesLength] = useState<any | undefined>(undefined);
    useEffect(() => {
        const fetchCagesLength = async () => {
            const cagesLength = await getAllCagesLengthAction();
            if (cagesLength.status === "success")
                setCagesLength(cagesLength);
        }
        fetchCagesLength();
    }, []);

    return (<>
        <div className="w-full flex-wrap basis-4 flex flex-row justify-center items-center gap-2">
            {cages.map((cage, index) => (
                <div key={index} onClick={() => { if (!loading) setSelectedCage(Number(cage)) }}
                    className={cn("p-2 flex flex-col items-center border-4 m-2  rounded-xl cursor-pointer", selectedCage === Number(cage) ? "border-red-600" : "")}>
                    <span className={cn("text-lg font-semibold text-red-600", loading ? "animate-pulse" : "")}>
                        {cage}
                    </span>
                    <span>
                        Total: <Badge className="bg-green-800 hover:bg-green-800 items-center">
                            {cagesLength?.value?.find((cageLength: any) => cageLength.cageCode === cage)?.length ?? 0}</Badge>
                    </span>
                </div >

            ))
            }
        </div >
    </>)
}