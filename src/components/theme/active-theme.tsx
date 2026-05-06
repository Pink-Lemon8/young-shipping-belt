"use client"

import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"

const COOKIE_NAME = "active_theme"
const DEFAULT_THEME = "default"

// Hoist RegExp creation outside function (Rule 7.7)
const COOKIE_REGEX = new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`)

function setThemeCookie(theme: string) {
    if (typeof window === "undefined") return

    document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure;" : ""}`
}

type ThemeContextType = {
    activeTheme: string
    setActiveTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getThemeFromCookie(): string {
    if (typeof document === "undefined") return DEFAULT_THEME
    const match = document.cookie.match(COOKIE_REGEX)
    return match ? match[2] : DEFAULT_THEME
}

export function ActiveThemeProvider({
    children,
    initialTheme,
}: {
    children: ReactNode
    initialTheme?: string
}) {
    const [activeTheme, setActiveTheme] = useState<string>(
        () => initialTheme || DEFAULT_THEME
    )

    // Read theme from cookie on mount if no initialTheme provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!initialTheme) {
            const cookieTheme = getThemeFromCookie()
            if (cookieTheme !== activeTheme) {
                setActiveTheme(cookieTheme)
            }
        }
    }, [initialTheme])

    useEffect(() => {
        setThemeCookie(activeTheme)

        Array.from(document.body.classList)
            .filter((className) => className.startsWith("theme-"))
            .forEach((className) => {
                document.body.classList.remove(className)
            })
        document.body.classList.add(`theme-${activeTheme}`)
        if (activeTheme.endsWith("-scaled")) {
            document.body.classList.add("theme-scaled")
        }
    }, [activeTheme])

    return (
        <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useThemeConfig() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error("useThemeConfig must be used within an ActiveThemeProvider")
    }
    return context
}