// Convert hex color to HSL string for CSS variables
export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '220 70% 45%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyTenantBranding(primaryColor: string, secondaryColor: string, accentColor: string) {
  const root = document.documentElement;
  const primaryHsl = hexToHsl(primaryColor);
  const secondaryHsl = hexToHsl(secondaryColor);
  const accentHsl = hexToHsl(accentColor);

  // Tenant-specific variables
  root.style.setProperty('--tenant-primary', primaryHsl);
  root.style.setProperty('--tenant-secondary', secondaryHsl);
  root.style.setProperty('--tenant-accent', accentHsl);

  // Override core design system so all components (buttons, rings, etc.) use tenant branding
  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--ring', primaryHsl);
  root.style.setProperty('--secondary', secondaryHsl);
  root.style.setProperty('--accent', accentHsl);

  // Sidebar theming
  root.style.setProperty('--sidebar-primary', primaryHsl);
  root.style.setProperty('--sidebar-ring', primaryHsl);
}

export function clearTenantBranding() {
  const root = document.documentElement;
  const props = [
    '--tenant-primary', '--tenant-secondary', '--tenant-accent',
    '--primary', '--ring', '--secondary', '--accent',
    '--sidebar-primary', '--sidebar-ring',
  ];
  props.forEach(p => root.style.removeProperty(p));
}

export const DEFAULT_BRANDING = {
  primary_color: '#1e40af',
  secondary_color: '#64748b',
  accent_color: '#0ea5e9',
  logo_url: null as string | null,
  support_email: null as string | null,
  support_phone: null as string | null,
  website: null as string | null,
  footer_company_name: null as string | null,
  footer_address: null as string | null,
  footer_city: null as string | null,
  footer_country: null as string | null,
  footer_email: null as string | null,
  footer_phone: null as string | null,
  footer_website: null as string | null,
};
