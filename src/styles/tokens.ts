export const colors = {
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--color-primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: {
    DEFAULT: 'hsl(var(--color-secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))',
  },
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    foreground: 'hsl(var(--warning-foreground))',
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  popover: {
    DEFAULT: 'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))',
  },
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  sidebar: {
    DEFAULT: 'hsl(var(--sidebar-background))',
    foreground: 'hsl(var(--sidebar-foreground))',
    primary: 'hsl(var(--sidebar-primary))',
    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    accent: 'hsl(var(--sidebar-accent))',
    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    border: 'hsl(var(--sidebar-border))',
    ring: 'hsl(var(--sidebar-ring))',
  },
  /* Marketplace brand colors */
  'mercado-livre': 'hsl(var(--mercado-livre))',
  shopee: 'hsl(var(--shopee))',
  instagram: 'hsl(var(--instagram))',
  /* Corporate Theme Colors */
  gunmetal: '200 40% 13%',
  'fern-green': '100 27% 43%',
  'tea-green': '100 58% 83%',
  'anti-flash-white': '0 0% 94%',
  cinnabar: '12 77% 55%',
} as const;

export const typography = {
  h1: 'var(--font-h1)',
  h2: 'var(--font-h2)',
  h3: 'var(--font-h3)',
  h4: 'var(--font-h4)',
  h5: 'var(--font-h5)',
  h6: 'var(--font-h6)',
  body: 'var(--font-size-body)',
  caption: 'var(--font-caption)',
} as const;

export const spacing = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
} as const;

export const fonts = {
  heading: 'var(--font-heading)',
  body: 'var(--font-body)',
} as const;

export const radii = {
  card: 'var(--card-radius)',
} as const;

export const shadows = {
  card: 'var(--card-shadow)',
} as const;

/**
 * Consolidated design tokens used across the application.
 * These tokens map to CSS variables declared in `index.css`.
 */
export const tokens = {
  colors,
  typography,
  spacing,
  fonts,
  radii,
  shadows,
} as const;

export type Tokens = typeof tokens;

/**
 * Structure used to override design tokens at runtime.
 * Each property accepts raw CSS values which will be assigned to
 * the corresponding CSS variables (e.g. `colors.primary` -> `--primary`).
 */
export type TokenOverrides = {
  colors?: Record<string, string>;
  typography?: Record<string, string>;
  spacing?: Record<string, string>;
  fonts?: Record<string, string>;
  radii?: Record<string, string>;
  shadows?: Record<string, string>;
};

