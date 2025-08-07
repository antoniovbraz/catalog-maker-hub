export const colors = {
  background: 'bg-background',
  foreground: 'text-foreground',
  card: 'bg-card text-card-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  muted: 'text-muted-foreground',
  primaryText: 'text-primary',
} as const;

export const typography = {
  h1: 'text-h1 font-heading',
  h2: 'text-h2 font-heading',
  h3: 'text-h3 font-heading',
  h4: 'text-h4 font-heading',
  h5: 'text-h5 font-heading',
  h6: 'text-h6 font-heading',
  body: 'text-body font-body',
  caption: 'text-caption font-body',
} as const;

export const spacing = {
  p: {
    sm: 'p-sm',
    md: 'p-md',
    lg: 'p-lg',
    xl: 'p-xl',
  },
  px: {
    sm: 'px-sm',
    md: 'px-md',
    lg: 'px-lg',
  },
  py: {
    sm: 'py-sm',
    md: 'py-md',
    lg: 'py-lg',
    xl: 'py-xl',
  },
  mb: {
    xs: 'mb-xs',
    sm: 'mb-sm',
    md: 'mb-md',
    lg: 'mb-lg',
  },
  gap: {
    xs: 'gap-xs',
    sm: 'gap-sm',
    md: 'gap-md',
    lg: 'gap-lg',
    xl: 'gap-xl',
  },
  spaceX: {
    xs: 'space-x-xs',
    sm: 'space-x-sm',
    md: 'space-x-md',
    lg: 'space-x-lg',
  },
  spaceY: {
    xs: 'space-y-xs',
    sm: 'space-y-sm',
    md: 'space-y-md',
    lg: 'space-y-lg',
  },
} as const;

export const designSystem = {
  colors,
  typography,
  spacing,
} as const;

export type DesignSystem = typeof designSystem;
