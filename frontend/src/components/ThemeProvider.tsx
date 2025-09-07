import React from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Always use light theme - no theme switching needed
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark", "system");
    root.classList.add("light");
  }, []);

  return <>{children}</>;
}