/**
 * Centralized design tokens for consistent styling across the application
 */

export const theme = {
  colors: {
    text: '#111827',
    textDark: '#1f2937',
    textSecondary: '#374151',
    muted: '#6b7280',
    mutedLight: '#9ca3af',
    mutedLighter: '#d1d5db',
    
    bg: '#ffffff',
    card: '#ffffff',
    
    border: '#e5e7eb',
    
    primary: '#0d6efd',
    primaryHover: '#535bf2',
    primaryLight: '#646cff',
    
    success: '#198754',
    successLight: '#16a34a',
    
    danger: '#dc3545',
    
    warning: '#f59e0b',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    '4xl': '2.5rem',
    '5xl': '3rem',
  },
  
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.5rem',
      '2xl': '2rem',
      '3xl': '3.2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.5,
    },
    letterSpacing: {
      tight: '0.03em',
      normal: '0.04em',
      wide: '0.08em',
    },
  },
  
  borders: {
    radius: {
      sm: '8px',
      md: '10px',
      full: '9999px',
    },
    width: '1px',
  },
  
  shadows: {
    sm: '0 6px 18px rgba(0,0,0,0.08)',
    md: '0 0 0 0.2rem rgba(13,110,253,0.25)',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.25s',
  },
};

export type Theme = typeof theme;
