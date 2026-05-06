import * as React from "react"
import { useEffect } from "react";

export function useBarcodeScanner() {

    const [scanCount, setScanCount] = React.useState<number>(0)
    const [scanBarcodeText, setScanBarcodeText] = React.useState<string>("")
    const [barcode, setBarcode] = React.useState<string | undefined>(undefined)

    const scanBarcode = (event: KeyboardEvent) => {
        const key = event.key;
        if (key.toLowerCase() !== "enter") {
            setScanBarcodeText((prev) => prev + key);
        }
        else if (key.toLowerCase() === "enter" && scanBarcodeText !== "") {
            setBarcode(scanBarcodeText);
            setScanBarcodeText("");
            setScanCount((prev) => prev + 1)
        }
    }


    const resetScanCount = () => {
        setScanCount(0)
    }

    const resetBarcode = (isResetScanCount: boolean = false) => {
        setBarcode(undefined)
        setScanBarcodeText("")
        if (isResetScanCount)
            setScanCount(0)
    }

    useEffect(() => {
        window.addEventListener("keypress", scanBarcode);
        return () => window.removeEventListener("keypress", scanBarcode);
    }, [scanBarcode, barcode, setBarcode, setScanBarcodeText]);

    return { barcode, resetBarcode, scanCount, resetScanCount }
}
