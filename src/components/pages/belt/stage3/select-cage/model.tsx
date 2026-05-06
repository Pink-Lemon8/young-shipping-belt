"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectCage from "./select";
import { ArrowRightIcon, Loader2 } from "lucide-react";
import GridCage from "./grid";
export default function SelectCageModel({ open, setOpen, selectedCage, setSelectedCage, onPushQueue, loading }: {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    selectedCage: number | undefined,
    setSelectedCage: React.Dispatch<React.SetStateAction<number | undefined>>,
    onPushQueue: () => void,
    loading: boolean,
}) {

    return (<>
        <Dialog open={open} onOpenChange={(open) => !loading && setOpen(open)}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} className="min-w-2xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Cage</DialogTitle>
                </DialogHeader>
                <div className="w-full flex flex-col items-center gap-2 overflow-y-auto min-h-0 flex-1">
                    <GridCage selectedCage={selectedCage} setSelectedCage={setSelectedCage} loading={loading} />
                </div>
                <div className="shrink-0 pt-2">
                    <Button onClick={onPushQueue} className="w-full" disabled={loading}>
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send <ArrowRightIcon className="w-4 h-4" /></>}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>)
}