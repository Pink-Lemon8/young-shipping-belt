"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cages } from "@/lib/const";
import { useEffect, useState } from "react";
import { getAllCagesLengthAction } from "./action";
import { Badge } from "@/components/ui/badge";

export default function SelectCage({ selectedCage, setSelectedCage }: {
    selectedCage: number | undefined,
    setSelectedCage: React.Dispatch<React.SetStateAction<number | undefined>>,
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
        <Select onValueChange={(value) => setSelectedCage(Number(value))} defaultValue={selectedCage?.toString()}>
            <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a cage" className="w-64" />
            </SelectTrigger>
            <SelectContent className="w-64" side="bottom" align="center">
                {cages.map((cage, index) => (
                    <SelectItem className="w-64 flex flex-row items-center justify-between space-x-2 group" key={index} value={cage.toString()}>
                        <div className="w-52 flex items-center flex-row justify-between space-x-2 ">
                            <span>
                                Cage {cage}
                            </span>
                            <hr className="grow border-red-600" />
                            <span>
                                Total: <Badge className="bg-red-600 hover:bg-red-600 items-center">
                                    {cagesLength?.value?.find((cageLength: any) => cageLength.cageCode === cage)?.length ?? 0}</Badge>
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </>)
}