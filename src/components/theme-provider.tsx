import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { useEffect } from "react";
import type { TokenOverrides } from "@/styles/tokens";
import { supabase } from "@/integrations/supabase/client";

export function ThemeProvider({
  children,
  defaultTheme,
  enableSystem,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      themes={["light", "dark", "corporate", "windows7"]}
      defaultTheme={defaultTheme ?? "corporate"}
      enableSystem={enableSystem ?? false}
      {...props}
    >
      <ThemeWatcher>{children}</ThemeWatcher>
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
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    const applyFromDb = (data: any) => {
      if (!data) return;
      const overrides: TokenOverrides = {
        colors: {
          "color-primary": data.primary_color,
          "color-secondary": data.secondary_color,
          "color-tertiary": data.tertiary_color,
        },
        fonts: {
          heading: data.font_heading,
          body: data.font_body,
        },
        typography: {
          h1: data.h1_size,
          h2: data.h2_size,
          body: data.body_size,
        },
      };
      applyTokenOverrides(overrides);
    };

    const loadSettings = async () => {
      const { data } = await supabase
        .from("theme_settings")
        .select("*")
        .single();
      if (mounted) {
        applyFromDb(data);
      }
    };

    loadSettings();

    const channel = supabase
      .channel("theme-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "theme_settings" },
        (payload) => {
          applyFromDb(payload.new);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return <>{children}</>;
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
    loadGoogleFont(value);
    root.style.setProperty(`--font-${key}`, value);
  });

  Object.entries(overrides.radii ?? {}).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  Object.entries(overrides.shadows ?? {}).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

function loadGoogleFont(font: string) {
  const id = `gf-${font.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

export { useTheme };
