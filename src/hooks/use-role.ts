import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'tenant_admin' | 'office_user' | 'technician';

/**
 * Centrale rol-hook voor zichtbaarheid in de UI.
 * NB: dit is puur UI-gating, RLS/auth blijft de bron van waarheid.
 */
export function useRole() {
  const { profile } = useAuth();
  const role = ((profile as any)?.role ?? null) as AppRole | null;

  const isTechnician = role === 'technician';
  const isTenantAdmin = role === 'tenant_admin';
  const isOfficeUser = role === 'office_user';
  // Admin = tenant_admin (en eventuele legacy "admin"). Office_user telt ook als kantoorrol.
  const isAdmin = isTenantAdmin || (role as string) === 'admin';
  const isOfficeOrAdmin = isAdmin || isOfficeUser;
  // Default veilig: zolang we de rol nog niet kennen, behandelen we als monteur (minimale UI).
  const isFieldOnly = role === null || isTechnician;

  return {
    role,
    isTechnician,
    isTenantAdmin,
    isOfficeUser,
    isAdmin,
    isOfficeOrAdmin,
    isFieldOnly,
  };
}
