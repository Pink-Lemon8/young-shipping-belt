import React from "react";
import { ThemeProvider, ActiveThemeProvider } from "@/components/theme";

const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <ActiveThemeProvider>
        {children}
      </ActiveThemeProvider>
    </ThemeProvider>
  );
};

export default GlobalProviders;
