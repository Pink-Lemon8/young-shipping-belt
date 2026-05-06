import localFont from 'next/font/local'
import { cn } from "@/lib/utils"

const fontMono = localFont({
    src: './files/GeistMono-Regular.woff2',
    variable: "--font-suisse-intl-mono",
})

const font = localFont({
    src: './files/SuisseIntlTrial-Regular.woff2',
    variable: "--font-suisse-intl",
})

const fontSerif = localFont({
    src: './files/SuisseWorks-Regular-WebTrial.woff2',
    variable: "--font-suisse-works",
})

export const fontVariables = cn(
    fontMono.variable,
    font.variable,
    fontSerif.variable
)

