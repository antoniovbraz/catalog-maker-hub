import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { useEffect } from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props}
      themes={["light", "dark", "corporate", "windows7"]}
      defaultTheme="corporate"
      enableSystem={false}
    >
      <ThemeWatcher>
        {children}
      </ThemeWatcher>
    </NextThemesProvider>
  );
}

function ThemeWatcher({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark', 'corporate', 'windows7');
    
    // Add current theme class
    if (theme) {
      root.classList.add(theme);
    }
  }, [theme]);

  return <>{children}</>;
}

export { useTheme };
