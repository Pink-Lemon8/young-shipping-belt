"use client"

import * as React from "react"
import { MoonIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Switch } from "@/components/ui/switch"

export function ThemeSwitch() {
  const { setTheme, theme } = useTheme()
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  // Check if system prefers dark mode when theme is 'system'
  React.useEffect(() => {
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(theme === "dark" || (theme === "system" && isSystemDark))

    // Add listener for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const handleChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
    setIsDarkMode(checked)
  }

  // We need to wait for the theme to be mounted to avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <div className="flex items-center gap-2">
        <MoonIcon className="h-4 w-4" />
        <span className="text-sm">Use Dark Mode</span>
      </div>
      <Switch checked={isDarkMode} onCheckedChange={handleChange} aria-label="Toggle dark mode" />
    </div>
  )
}

