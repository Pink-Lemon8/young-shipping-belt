"use client"

import { useThemeConfig } from "./active-theme"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const DEFAULT_THEMES = [
    {
        name: "Default",
        value: "default",
    },
    {
        name: "Red",
        value: "red",
    },
    {
        name: "Perpetuity",
        value: "perpetuity",
    },
    {
        name: "Pastel",
        value: "pastel",
    },
    {
        name: "Kodama",
        value: "kodama",
    },
    {
        name: "Verdant",
        value: "verdant",
    },
    {
        name: "Nature",
        value: "nature",
    },
    {
        name: "Tangerine",
        value: "tangerine",
    },
    {
        name: "Solar Dusk",
        value: "solar",
    },
    {
        name: "Starry Night",
        value: "starry",
    },
    {
        name: "Twitter",
        value: "twitter",
    },
    {
        name: "Darkmatter",
        value: "darkmatter",
    },
]

const SCALED_THEMES = [
    {
        name: "Default",
        value: "default-scaled",
    },
    {
        name: "Red",
        value: "red-scaled",
    },
    {
        name: "Pastel",
        value: "pastel-scaled",
    },
    {
        name: "Kodama",
        value: "kodama-scaled",
    },
    {
        name: "Perpetuity",
        value: "perpetuity-scaled",
    },
    {
        name: "Verdant",
        value: "verdant-scaled",
    },
    {
        name: "Nature",
        value: "nature-scaled",
    },
    {
        name: "Tangerine",
        value: "tangerine-scaled",
    },
    {
        name: "Solar Dusk",
        value: "solar-scaled",
    },
    {
        name: "Starry Night",
        value: "starry-scaled",
    },
    {
        name: "Twitter",
        value: "twitter-scaled",
    },
    {
        name: "Darkmatter",
        value: "darkmatter-scaled",
    },
]

const MONO_THEMES = [
    {
        name: "Mono",
        value: "mono",
    },
    {
        name: "Mono Scaled",
        value: "mono-scaled",
    }
]

export function ThemeSelector({ className }: { className?: string }) {
    const { activeTheme, setActiveTheme } = useThemeConfig()
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Label htmlFor="theme-selector" className="sr-only">
                Theme
            </Label>
            <Select value={activeTheme} onValueChange={setActiveTheme}>
                <SelectTrigger
                    id="theme-selector"
                    className="justify-between data-[slot=select-value]:*:w-24"
                >
                    <span className="text-muted-foreground block sm:hidden">Theme</span>
                    <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent align="end" className="w-[300px]">
                    <SelectGroup>
                        <SelectLabel>Regular</SelectLabel>
                        <div className="grid grid-cols-2 gap-1">
                            {DEFAULT_THEMES.map((theme) => (
                                <SelectItem key={theme.name} value={theme.value}>
                                    {theme.name}
                                </SelectItem>
                            ))}
                        </div>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                        <SelectLabel>Scaled</SelectLabel>
                        <div className="grid grid-cols-2 gap-1">
                            {SCALED_THEMES.map((theme) => (
                                <SelectItem key={theme.name} value={theme.value}>
                                    {theme.name}
                                </SelectItem>
                            ))}
                        </div>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                        <SelectLabel>Mono</SelectLabel>
                        <div className="grid grid-cols-2 gap-1">
                            {MONO_THEMES.map((theme) => (
                                <SelectItem key={theme.name} value={theme.value}>
                                    {theme.name}
                                </SelectItem>
                            ))}
                        </div>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}