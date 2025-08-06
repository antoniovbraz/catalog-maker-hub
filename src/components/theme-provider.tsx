import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { useEffect } from "react";
import type { TokenOverrides } from "@/styles/tokens";

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
    root.classList.remove("light", "dark", "corporate", "windows7");

    // Add current theme class
    if (theme) {
      root.classList.add(theme);
    }

    // Load and apply Super Admin token overrides
    loadSuperAdminTokens().then(applyTokenOverrides);
  }, [theme]);

  return <>{children}</>;
}

// Fetch token overrides saved by the Super Admin.
// In a real application this could be an API request; here we read from localStorage.
async function loadSuperAdminTokens(): Promise<TokenOverrides> {
  try {
    const raw = localStorage.getItem("super-admin-tokens");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Apply token overrides by updating the corresponding CSS variables.
function applyTokenOverrides(overrides: TokenOverrides) {
  const root = document.documentElement;

  Object.entries(overrides.colors ?? {}).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  Object.entries(overrides.typography ?? {}).forEach(([key, value]) => {
    const variable = key === 'body' ? '--font-size-body' : `--font-${key}`;
    root.style.setProperty(variable, value);
  });

  Object.entries(overrides.spacing ?? {}).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });

  Object.entries(overrides.fonts ?? {}).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });

  Object.entries(overrides.radii ?? {}).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  Object.entries(overrides.shadows ?? {}).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

export { useTheme };
