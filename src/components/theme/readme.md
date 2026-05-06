```
const cookieStore = await cookies();
const activeThemeValue = cookieStore.get("active_theme")?.value;
const isScaled = activeThemeValue?.endsWith("-scaled");
```

```
<body
        className={cn(
          "bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : "",
          fontVariables,
          `selection:bg-primary selection:text-white`
        )}
      >
  <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
  >
      <ActiveThemeProvider initialTheme={activeThemeValue}>
      <>{children}</>
      </ActiveThemeProvider>
  </ThemeProvider>
</body>
```
